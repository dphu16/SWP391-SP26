package com.project.hrm.payroll.compensation.controller;

import com.project.hrm.payroll.compensation.dto.CreatePeriodRequest;
import com.project.hrm.payroll.compensation.dto.PeriodResponse;
import com.project.hrm.payroll.compensation.service.PayrollPeriodService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/payroll/periods")
@RequiredArgsConstructor
public class PayrollPeriodController {
    private final PayrollPeriodService service;

    @PostMapping
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
