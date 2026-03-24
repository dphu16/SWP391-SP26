package com.project.hrm.module.payroll.service;

import com.project.hrm.module.payroll.dto.RequestDTO.UpdatePayslipDetailRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.PayslipResponse;
import com.project.hrm.module.payroll.entity.PayrollBatch;
import com.project.hrm.module.payroll.entity.Payslip;
import com.project.hrm.module.payroll.entity.PayslipDetail;
import com.project.hrm.module.payroll.enums.PayrollBatchStatus;
import com.project.hrm.module.payroll.enums.PayslipDetailType;
import com.project.hrm.module.payroll.enums.PayslipStatus;
import com.project.hrm.module.payroll.exception.AccessDeniedException;
import com.project.hrm.module.payroll.exception.PayrollException;
import com.project.hrm.module.payroll.exception.ResourceNotFoundException;
import com.project.hrm.module.payroll.repository.PayrollBatchRepository;
import com.project.hrm.module.payroll.repository.PayslipDetailRepository;
import com.project.hrm.module.payroll.repository.PayslipRepository;
import com.project.hrm.module.corehr.entity.BankAccount;
import com.project.hrm.module.corehr.repository.BankAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PayslipService {

        private final PayslipRepository payslipRepository;
        private final EmployeeRepository employeeRepository;
        private final PayrollCalculationService calculationService;
        private final PayrollBatchRepository batchRepository;
        private final PayslipDetailRepository payslipDetailRepository;
        private final BankAccountRepository bankAccountRepository;

        /** Employee: Xem danh sách phiếu lương của chính mình */
        @Transactional(readOnly = true)
        public List<PayslipResponse> getMyPayslips(UUID employeeId) {
                return payslipRepository.findAllByEmployee_EmployeeIdOrderByCreatedAtDesc(employeeId)
                                .stream().map(this::toResponse).collect(Collectors.toList());
        }

        /** Employee: Xem chi tiết 1 phiếu lương — chỉ được xem của chính mình */
        @Transactional(readOnly = true)
        public PayslipResponse getMyPayslip(UUID payslipId, UUID requestingEmployeeId) {
                Payslip payslip = findOrThrow(payslipId);
                if (!payslip.getEmployee().getEmployeeId().equals(requestingEmployeeId)) {
                        throw new AccessDeniedException("Bạn không có quyền xem phiếu lương này.");
                }
                return toResponse(payslip);
        }

        /** HR: Xem tất cả payslip trong một batch */
        @Transactional(readOnly = true)
        public List<PayslipResponse> getPayslipsByBatch(UUID batchId) {
                return payslipRepository.findAllByBatch_BatchId(batchId)
                                .stream().map(this::toResponse).collect(Collectors.toList());
        }

        /** HR: Tính lương cho toàn bộ employee trong batch (hoặc demo) */
        @Transactional
        public List<PayslipResponse> calculateForBatch(UUID batchId) {
                // Tạm thời demo: Tính lương cho tất cả Employee.
                // Thực tế có thể phân trang hoặc lấy theo Status = ACTIVE hoặc RESIGNED trong
                // tháng
                List<Employee> employees = employeeRepository.findAll();
                List<UUID> empIds = employees.stream().map(Employee::getEmployeeId).collect(Collectors.toList());
                // Gọi sang calculationService.calculateBatch
                List<Payslip> generated = calculationService.calculateBatch(batchId, empIds);
                return generated.stream().map(this::toResponse).collect(Collectors.toList());
        }

        /** HR: Xem Tax & Insurance Report cho 1 batch */
        @Transactional(readOnly = true)
        public List<com.project.hrm.module.payroll.dto.ResponseDTO.TaxReportResponse> getTaxReportByBatch(
                        UUID batchId) {
                return payslipRepository.findAllByBatch_BatchId(batchId).stream().map(p -> {
                        return com.project.hrm.module.payroll.dto.ResponseDTO.TaxReportResponse.builder()
                                        .employeeId(p.getEmployee().getEmployeeId())
                                        .employeeCode(p.getEmployee().getEmployeeCode())
                                        .employeeName(p.getEmployee().getFullName())
                                        .department(p.getEmployee().getDepartment() != null
                                                        ? p.getEmployee().getDepartment().getDeptName()
                                                        : null)
                                        .position(p.getEmployee().getPosition() != null
                                                        ? p.getEmployee().getPosition().getTitle()
                                                        : null)
                                        .month(p.getPeriod().getMonth())
                                        .year(p.getPeriod().getYear())
                                        .baseSalary(p.getBaseSalary() != null ? p.getBaseSalary().doubleValue() : 0.0)
                                        .grossSalary(p.getGrossSalary() != null ? p.getGrossSalary().doubleValue()
                                                        : 0.0)
                                        .taxAmount(p.getTaxAmount() != null ? p.getTaxAmount().doubleValue() : 0.0)
                                        .insuranceAmount(p.getInsuranceAmount() != null
                                                        ? p.getInsuranceAmount().doubleValue()
                                                        : 0.0)
                                        .totalDeductions(p.getTotalDeductions() != null
                                                        ? p.getTotalDeductions().doubleValue()
                                                        : 0.0)
                                        .netSalary(p.getNetSalary() != null ? p.getNetSalary().doubleValue() : 0.0)
                                        .build();
                }).collect(Collectors.toList());
        }

        /** HR: Xác nhận (confirm) toàn bộ phiếu lương trong batch */
        @Transactional
        public List<PayslipResponse> validateAllInBatch(UUID batchId) {
                List<Payslip> payslips = payslipRepository.findAllByBatch_BatchId(batchId);
                for (Payslip p : payslips) {
                        if (p.getStatus() == PayslipStatus.DRAFT) {
                                p.setStatus(PayslipStatus.CONFIRMED);
                                p.setConfirmedAt(OffsetDateTime.now());
                        }
                }
                List<Payslip> saved = payslipRepository.saveAll(payslips);
                checkAndUpdateBatchStatus(batchId);
                return saved.stream().map(this::toResponse).collect(Collectors.toList());
        }

        /** HR: Xác nhận (confirm) một phiếu lương — chỉ được confirm khi đang DRAFT */
        @Transactional
        public PayslipResponse confirmPayslip(UUID payslipId) {
                Payslip payslip = findOrThrow(payslipId);
                if (payslip.getStatus() != PayslipStatus.DRAFT) {
                        throw new PayrollException("Chỉ có thể xác nhận phiếu lương đang ở trạng thái DRAFT.");
                }
                payslip.setStatus(PayslipStatus.CONFIRMED);
                payslip.setConfirmedAt(OffsetDateTime.now());
                Payslip saved = payslipRepository.save(payslip);
                checkAndUpdateBatchStatus(saved.getBatch().getBatchId());
                return toResponse(saved);
        }

        /**
         * UR_HR004: HR chỉnh sửa thủ công chi tiết phiếu lương (allowance/deduction).
         * Chỉ được phép khi payslip đang DRAFT.
         * Toàn bộ details cũ sẽ bị xóa và thay thế bằng danh sách mới.
         * Sau đó tự động tính lại totalAllowances, totalDeductions, grossSalary, netSalary.
         */
        @Transactional
        public PayslipResponse updatePayslipDetails(UUID payslipId, UpdatePayslipDetailRequest req) {
                Payslip payslip = findOrThrow(payslipId);
                if (payslip.getStatus() != PayslipStatus.DRAFT) {
                        throw new PayrollException("Chỉ có thể chỉnh sửa chi tiết phiếu lương đang ở trạng thái DRAFT.");
                }

                // Xóa toàn bộ details cũ
                payslipDetailRepository.deleteAllByPayslip_PayslipId(payslipId);
                payslipDetailRepository.flush();

                // Tạo details mới
                List<PayslipDetail> newDetails = new ArrayList<>();
                for (UpdatePayslipDetailRequest.DetailItem item : req.getDetails()) {
                        newDetails.add(PayslipDetail.builder()
                                .payslip(payslip)
                                .itemName(item.getItemName())
                                .amount(item.getAmount())
                                .type(item.getType())
                                .createdAt(OffsetDateTime.now())
                                .build());
                }
                payslipDetailRepository.saveAll(newDetails);
                payslip.setDetails(newDetails);

                // Tính lại tổng allowance / deduction
                BigDecimal totalAllowances = newDetails.stream()
                        .filter(d -> d.getType() == PayslipDetailType.ALLOWANCE)
                        .map(PayslipDetail::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal manualDeductions = newDetails.stream()
                        .filter(d -> d.getType() == PayslipDetailType.DEDUCTION)
                        .map(PayslipDetail::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                // Giữ nguyên baseSalary, otPay, absentDeduction — chỉ cập nhật allowances & deductions
                BigDecimal base = payslip.getBaseSalary() != null ? payslip.getBaseSalary() : BigDecimal.ZERO;
                BigDecimal otPay = payslip.getOtPay() != null ? payslip.getOtPay() : BigDecimal.ZERO;
                BigDecimal absentDed = payslip.getAbsentDeduction() != null ? payslip.getAbsentDeduction() : BigDecimal.ZERO;

                BigDecimal grossSalary = base.add(otPay).add(totalAllowances).subtract(absentDed);
                BigDecimal totalDeductions = manualDeductions;
                BigDecimal netSalary = grossSalary.subtract(totalDeductions);

                payslip.setTotalAllowances(totalAllowances);
                payslip.setTotalDeductions(totalDeductions);
                payslip.setGrossSalary(grossSalary);
                payslip.setNetSalary(netSalary);
                // tax & insurance are now embedded in manual deductions if HR added them
                payslip.setTaxAmount(BigDecimal.ZERO);
                payslip.setInsuranceAmount(BigDecimal.ZERO);

                Payslip saved = payslipRepository.save(payslip);
                return toResponse(saved);
        }

        /** HR: Huỷ phiếu lương — chỉ được huỷ khi chưa PAID */
        @Transactional
        public PayslipResponse cancelPayslip(UUID payslipId) {
                Payslip payslip = findOrThrow(payslipId);
                if (payslip.getStatus() == PayslipStatus.PAID) {
                        throw new PayrollException("Không thể huỷ phiếu lương đã thanh toán.");
                }
                payslip.setStatus(PayslipStatus.CANCELLED);
                Payslip saved = payslipRepository.save(payslip);
                checkAndUpdateBatchStatus(saved.getBatch().getBatchId());
                return toResponse(saved);
        }

        private void checkAndUpdateBatchStatus(UUID batchId) {
                List<Payslip> payslips = payslipRepository.findAllByBatch_BatchId(batchId);
                if (payslips.isEmpty())
                        return;

                boolean allConfirmed = payslips.stream()
                                .filter(p -> p.getStatus() != PayslipStatus.CANCELLED)
                                .allMatch(p -> p.getStatus() == PayslipStatus.CONFIRMED
                                                || p.getStatus() == PayslipStatus.PAID);

                if (allConfirmed) {
                        PayrollBatch batch = batchRepository.findById(batchId).orElse(null);
                        // Khi xác nhận hết, Batch vẫn ở trạng thái VALIDATED (chờ HR bấm Gửi Finance mới sang PROCESSED)
                        if (batch != null && batch.getStatus() == PayrollBatchStatus.DRAFT) {
                                batch.setStatus(PayrollBatchStatus.VALIDATED);
                                batchRepository.save(batch);
                        }
                }
        }

        private Payslip findOrThrow(UUID payslipId) {
                return payslipRepository.findById(payslipId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Phiếu lương không tồn tại: " + payslipId));
        }

        public PayslipResponse toResponse(Payslip p) {
                List<PayslipResponse.DetailItem> details = p.getDetails() == null ? List.of()
                                : p.getDetails().stream().map(d -> PayslipResponse.DetailItem.builder()
                                                .itemName(d.getItemName())
                                                .amount(d.getAmount())
                                                .type(d.getType())
                                                .build()).collect(Collectors.toList());

                // Tự động lấy thông tin ngân hàng của nhân viên từ CoreHR
                BankAccount bank = bankAccountRepository
                                .findByEmployee_EmployeeId(p.getEmployee().getEmployeeId())
                                .orElse(null);

                return PayslipResponse.builder()
                                .payslipId(p.getPayslipId())
                                .employeeId(p.getEmployee().getEmployeeId())
                                .employeeName(p.getEmployee().getFullName())
                                .departmentName(p.getEmployee().getDepartment() != null ? p.getEmployee().getDepartment().getDeptName() : "N/A")
                                .bankName(bank != null ? bank.getBankName() : null)
                                .accountNumber(bank != null ? bank.getAccountNumber() : null)
                                .accountHolderName(bank != null ? bank.getAccountHolderName() : null)
                                .branchName(bank != null ? bank.getBranchName() : null)
                                .batchId(p.getBatch().getBatchId())
                                .periodId(p.getPeriod().getPeriodId())
                                .month(p.getPeriod().getMonth())
                                .year(p.getPeriod().getYear())
                                .totalOtHours(p.getTotalOtHours())
                                .totalAbsentDays(p.getTotalAbsentDays())
                                .totalWorkDays(p.getTotalWorkDays())
                                .baseSalary(p.getBaseSalary())
                                .otPay(p.getOtPay())
                                .absentDeduction(p.getAbsentDeduction())
                                .totalAllowances(p.getTotalAllowances())
                                .grossSalary(p.getGrossSalary())
                                .taxAmount(p.getTaxAmount())
                                .insuranceAmount(p.getInsuranceAmount())
                                .totalDeductions(p.getTotalDeductions())
                                .netSalary(p.getNetSalary())
                                .status(p.getStatus())
                                .details(details)
                                .confirmedAt(p.getConfirmedAt())
                                .paidAt(p.getPaidAt())
                                .createdAt(p.getCreatedAt())
                                .build();
        }
}
