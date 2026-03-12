package com.project.hrm.module.recruitment.dto.request;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;

@Getter
@Setter
public class EmailRequest {
    private String title;
    private String hrName;
    private String candidateName;
    private String canEmail;
    private String canPhone;
    private OffsetDateTime date;
    private OffsetDateTime start;
    private OffsetDateTime end;
    private String cvUrl;
}
