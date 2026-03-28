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
        // Không cho tạo 2 kỳ trùng tháng/năm
        if (periodRepository.existsByMonthAndYear(request.getMonth(), request.getYear())) {
            throw new PayrollException(
                    "Payroll period " + request.getMonth() + "/" + request.getYear() + " already exists.");
        }

        // Không cho tạo kỳ mới nếu vẫn còn kỳ đang OPEN
        List<PayrollPeriod> openPeriods = periodRepository
                .findAllByStatusOrderByYearDescMonthDesc(PayrollPeriodStatus.OPEN);
        if (!openPeriods.isEmpty()) {
            throw new PayrollException("Please complete (PAID/CLOSE) the current payroll period " +
                    openPeriods.get(0).getMonth() + "/" + openPeriods.get(0).getYear()
                    + " before creating a new one.");
        }

        //Kỳ lương phải được tạo tuần tự theo từng tháng, không được bỏ qua tháng.
        periodRepository.findTopByOrderByYearDescMonthDesc().ifPresent(latestPeriod -> {
            YearMonth latestYM = YearMonth.of(latestPeriod.getYear(), latestPeriod.getMonth());
            YearMonth requestedYM = YearMonth.of(request.getYear(), request.getMonth());
            YearMonth expectedNextYM = latestYM.plusMonths(1);

            if (!requestedYM.equals(expectedNextYM)) {
                throw new PayrollException(
                        "Payroll periods must be created sequentially. The next period must be "
                        + expectedNextYM.getMonthValue() + "/" + expectedNextYM.getYear()
                        + " (latest period is " + latestPeriod.getMonth() + "/" + latestPeriod.getYear() + ").");
            }
        });

        // Khi tạo kỳ mới, tự động chuyển tất cả kỳ PAID --> CLOSED (lưu trữ lịch sử)
        List<PayrollPeriod> paidPeriods = periodRepository
                .findAllByStatusOrderByYearDescMonthDesc(PayrollPeriodStatus.PAID);
        if (!paidPeriods.isEmpty()) {
            paidPeriods.forEach(p -> p.setStatus(PayrollPeriodStatus.CLOSED));
            periodRepository.saveAll(paidPeriods);
        }

        // Nếu không thì tự tính theo tháng/năm (mặc định = ngày 1 và ngày cuối tháng).
        YearMonth yearMonth = YearMonth.of(request.getYear(), request.getMonth());
        LocalDate startDate = (request.getStartDate() != null)
                ? request.getStartDate()
                : yearMonth.atDay(1);
        LocalDate endDate = (request.getEndDate() != null)
                ? request.getEndDate()
                : yearMonth.atEndOfMonth();

        // startDate phải <= endDate
        if (startDate.isAfter(endDate)) {
            throw new PayrollException(
                    "Start date (" + startDate + ") must be before or equal to end date (" + endDate + ").");
        }

        // startDate phải thuộc tháng/năm đã chọn
        if (startDate.getMonthValue() != request.getMonth() || startDate.getYear() != request.getYear()) {
            throw new PayrollException(
                    "Start date must fall within " + request.getMonth() + "/" + request.getYear() + ".");
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
            throw new PayrollException("Only OPEN payroll periods can be closed.");
        }
        // Không cho đóng kỳ khi còn payslip chưa PAID
        boolean hasUnpaidPayslips = payslipRepository
                .existsByBatch_Period_PeriodIdAndStatusNot(periodId, PayslipStatus.PAID);
        if (hasUnpaidPayslips) {
            throw new PayrollException("There are still unpaid payslips in this period.");
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
                .orElseThrow(() -> new ResourceNotFoundException("Payroll period not found: " + periodId));
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
