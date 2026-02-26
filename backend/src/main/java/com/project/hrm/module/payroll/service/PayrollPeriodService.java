package com.project.hrm.module.payroll.service;

import com.project.hrm.module.payroll.enums.PeriodStatus;
import com.project.hrm.module.payroll.dto.RequestDTO.CreatePeriodRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.PeriodResponse;
import com.project.hrm.module.payroll.entity.PayrollPeriods;
import com.project.hrm.module.payroll.repository.PayrollPeriodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PayrollPeriodService {
    private final PayrollPeriodRepository payrollPeriodRepository;

    public PeriodResponse create(CreatePeriodRequest periodRequest) {
        if(payrollPeriodRepository.existsByMonthAndYear(
                periodRequest.getMonth(),
                periodRequest.getYear())){

            throw new RuntimeException("Payroll period already exists");
        }

        PayrollPeriods period = PayrollPeriods.builder()
                .month(periodRequest.getMonth())
                .year(periodRequest.getYear())
                .startDate(periodRequest.getStartDate())
                .endDate(periodRequest.getEndDate())
                .status(PeriodStatus.OPEN)
                .createAt(OffsetDateTime.now())
                .build();

        payrollPeriodRepository.save(period);

        return mapToResponse(period);
    }

    public void closePeriod(UUID periodId){
    PayrollPeriods period = payrollPeriodRepository.findById(periodId)
            .orElseThrow(() -> new RuntimeException("Period not found"));

    if(period.getStatus() != PeriodStatus.OPEN){
        throw new RuntimeException("Only OPEN period can be closed");
    }
        period.setStatus(PeriodStatus.CLOSED);
    }



    private PeriodResponse mapToResponse(PayrollPeriods period) {
        return PeriodResponse.builder()
                .id(period.getPeriodId())
                .month(period.getMonth())
                .year(period.getYear())
                .startDate(period.getStartDate())
                .endDate(period.getEndDate())
                .periodStatus(period.getStatus())
                .build();
    }
}
