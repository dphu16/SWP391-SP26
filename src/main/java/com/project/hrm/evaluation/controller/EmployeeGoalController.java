package com.project.hrm.evaluation.controller;

import com.project.hrm.evaluation.entity.EmployeeGoal;
import com.project.hrm.evaluation.service.EmployeeGoalService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.math.BigDecimal;
import java.util.UUID;

public class EmployeeGoalController {
    private final EmployeeGoalService service;


    public EmployeeGoalController(EmployeeGoalService service) {
        this.service = service;
    }

    @PostMapping
    public EmployeeGoal assignKpi(@RequestParam UUID employeeId,
                                  @RequestParam UUID cycleId,
                                  @RequestParam UUID kpiLibId,
                                  @RequestParam String title,
                                  @RequestParam BigDecimal targetValue,
                                  @RequestParam BigDecimal currenValue,
                                  @RequestParam BigDecimal weight){
        return service.assignKpi(employeeId, cycleId, kpiLibId, title, currenValue, targetValue, weight);
    }
}
