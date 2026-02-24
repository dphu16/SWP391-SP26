package com.project.hrm.module.payroll.compensation.controller;

import com.project.hrm.module.payroll.compensation.dto.RequestDTO.CreatePeriodRequest;
import com.project.hrm.module.payroll.compensation.dto.ResponseDTO.PeriodResponse;
import com.project.hrm.module.payroll.compensation.service.PayrollPeriodService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/payroll/periods")
@RequiredArgsConstructor
public class PayrollPeriodController {
    private final PayrollPeriodService service;

    @PostMapping("/create")
    public ResponseEntity<PeriodResponse> create(
            @RequestBody CreatePeriodRequest request) {

        return ResponseEntity.ok(service.create(request));
    }

    @PutMapping("/{id}/close")
    public ResponseEntity<Void> close(@PathVariable UUID id) {
        service.closePeriod(id);
        return ResponseEntity.ok().build();
    }
}
