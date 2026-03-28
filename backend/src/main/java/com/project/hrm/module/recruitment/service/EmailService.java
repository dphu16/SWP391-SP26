package com.project.hrm.module.recruitment.service;

import com.project.hrm.module.recruitment.dto.request.EmailRequest;

public interface EmailService {
    void sendEmail(EmailRequest request);
}
