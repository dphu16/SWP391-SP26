package com.project.hrm.payroll.compensation.controller;

import com.project.hrm.payroll.compensation.entity.SalaryProfile;
import com.project.hrm.payroll.compensation.service.SalaryProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payroll/salary-profiles")
@RequiredArgsConstructor
public class SalaryProfileController {

    private final SalaryProfileService service;

    @PostMapping
    public SalaryProfile create(@RequestBody SalaryProfile profile) {
        return service.create(profile);
    }
}

