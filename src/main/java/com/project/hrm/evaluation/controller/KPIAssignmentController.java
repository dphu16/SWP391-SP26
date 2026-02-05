package com.project.hrm.evaluation.controller;


import com.project.hrm.evaluation.entity.KpiAcknowledgement;
import com.project.hrm.evaluation.service.KpiAcknowledgementService;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

import java.util.UUID;

public class KPIAssignmentController {
    private final KpiAcknowledgementService service;

    public KPIAssignmentController(KpiAcknowledgementService service) {
        this.service = service;
    }

    @PutMapping
    public KpiAcknowledgement updateAckownledgement(@PathVariable UUID goalId, @PathVariable UUID employeeId){
        return service.confirm(goalId, employeeId);
    }
}
