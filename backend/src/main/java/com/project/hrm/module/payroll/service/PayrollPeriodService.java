package com.project.hrm.module.payroll.service;

import com.project.hrm.module.payroll.dto.RequestDTO.CreatePayrollPeriodRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.PayrollPeriodResponse;
import com.project.hrm.module.payroll.entity.PayrollBatch;
import com.project.hrm.module.payroll.entity.PayrollPeriod;
import com.project.hrm.module.payroll.enums.PayrollBatchStatus;
import com.project.hrm.module.payroll.enums.PayrollPeriodStatus;
import com.project.hrm.module.payroll.enums.PayslipStatus;
import com.project.hrm.module.payroll.exception.PayrollException;
import com.project.hrm.module.payroll.exception.ResourceNotFoundException;
import com.project.hrm.module.payroll.repository.PayrollBatchRepository;
import com.project.hrm.module.payroll.repository.PayrollPeriodRepository;
import com.project.hrm.module.payroll.repository.PayslipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PayrollPeriodService {

    private final PayrollPeriodRepository periodRepository;
    private final PayslipRepository payslipRepository;
    private final PayrollBatchRepository batchRepository;

    @Transactional
    public PayrollPeriodResponse createPeriod(CreatePayrollPeriodRequest request) {
        // [RULE] Không cho tạo 2 kỳ trùng tháng/năm
        if (periodRepository.existsByMonthAndYear(request.getMonth(), request.getYear())) {
            throw new PayrollException(
                    "Kỳ lương tháng " + request.getMonth() + "/" + request.getYear() + " đã tồn tại.");
        }

        // [RULE] Không cho tạo kỳ mới nếu vẫn còn kỳ đang OPEN
        List<PayrollPeriod> openPeriods = periodRepository
                .findAllByStatusOrderByYearDescMonthDesc(PayrollPeriodStatus.OPEN);
        if (!openPeriods.isEmpty()) {
            throw new PayrollException("Vui lòng hoàn tất (PAID/CLOSE) kỳ lương " +
                    openPeriods.get(0).getMonth() + "/" + openPeriods.get(0).getYear()
                    + " hiện tại trước khi tạo kỳ mới.");
        }

        // [RULE] Khi tạo kỳ mới, tự động chuyển tất cả kỳ PAID → CLOSED (lưu trữ lịch
        // sử)
        List<PayrollPeriod> paidPeriods = periodRepository
                .findAllByStatusOrderByYearDescMonthDesc(PayrollPeriodStatus.PAID);
        if (!paidPeriods.isEmpty()) {
            paidPeriods.forEach(p -> p.setStatus(PayrollPeriodStatus.CLOSED));
            periodRepository.saveAll(paidPeriods);
        }

        // Bug Fix #4: Dùng startDate/endDate từ request nếu HR điền vào,
        // nếu không thì tự tính theo tháng/năm (mặc định = ngày 1 và ngày cuối tháng).
        YearMonth yearMonth = YearMonth.of(request.getYear(), request.getMonth());
        LocalDate startDate = (request.getStartDate() != null)
                ? request.getStartDate()
                : yearMonth.atDay(1);
        LocalDate endDate = (request.getEndDate() != null)
                ? request.getEndDate()
                : yearMonth.atEndOfMonth();

        // [VALIDATION] startDate phải <= endDate
        if (startDate.isAfter(endDate)) {
            throw new PayrollException(
                    "Ngày bắt đầu (" + startDate + ") phải trước hoặc bằng ngày kết thúc (" + endDate + ").");
        }

        // [VALIDATION] startDate phải thuộc tháng/năm đã chọn
        if (startDate.getMonthValue() != request.getMonth() || startDate.getYear() != request.getYear()) {
            throw new PayrollException(
                    "Ngày bắt đầu phải nằm trong tháng " + request.getMonth() + "/" + request.getYear() + ".");
        }

        PayrollPeriod period = PayrollPeriod.builder()
                .month(request.getMonth())
                .year(request.getYear())
                .startDate(startDate)
                .endDate(endDate)
                .status(PayrollPeriodStatus.OPEN)
                .build();

        period = periodRepository.save(period);

        PayrollBatch batch = PayrollBatch.builder()
                .period(period)
                .status(PayrollBatchStatus.DRAFT)
                .note("Auto generated batch for " + request.getMonth() + "/" + request.getYear())
                .build();
        batchRepository.save(batch);

        return toResponse(period);
    }

    @Transactional
    public PayrollPeriodResponse closePeriod(UUID periodId) {
        PayrollPeriod period = findOrThrow(periodId);

        if (period.getStatus() != PayrollPeriodStatus.OPEN) {
            throw new PayrollException("Chỉ có thể đóng kỳ lương đang OPEN.");
        }
        // [RULE] Không cho đóng kỳ khi còn payslip chưa PAID
        boolean hasUnpaidPayslips = payslipRepository
                .existsByBatch_Period_PeriodIdAndStatusNot(periodId, PayslipStatus.PAID);
        if (hasUnpaidPayslips) {
            throw new PayrollException("Còn phiếu lương chưa thanh toán trong kỳ này.");
        }

        period.setStatus(PayrollPeriodStatus.PAID);
        return toResponse(periodRepository.save(period));
    }

    @Transactional(readOnly = true)
    public List<PayrollPeriodResponse> getAllPeriods() {
        return periodRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PayrollPeriodResponse getPeriod(UUID periodId) {
        return toResponse(findOrThrow(periodId));
    }

    private PayrollPeriod findOrThrow(UUID periodId) {
        return periodRepository.findById(periodId)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ lương không tồn tại: " + periodId));
    }

    private PayrollPeriodResponse toResponse(PayrollPeriod p) {
        var batchOpt = batchRepository.findByPeriod_PeriodId(p.getPeriodId());

        return PayrollPeriodResponse.builder()
                .periodId(p.getPeriodId())
                .batchId(batchOpt.map(PayrollBatch::getBatchId).orElse(null))
                .batchStatus(batchOpt.map(PayrollBatch::getStatus).orElse(null))
                .month(p.getMonth())
                .year(p.getYear())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .status(p.getStatus())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
