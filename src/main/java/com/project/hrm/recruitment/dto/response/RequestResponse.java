package com.project.hrm.recruitment.dto.response;

import com.project.hrm.recruitment.enums.EmploymentTypeStatus;
import com.project.hrm.recruitment.enums.RequestStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
public class RequestResponse {

    private UUID requestId;

    private String jobTitle;
    private UUID deptId;
    private String deptName;
    private int quantity;
    private String location;
    private EmploymentTypeStatus empType;
    private UUID reportTo;
    private String reviewer;
    private String reason;
    private OffsetDateTime createAt;

    private RequestStatus status;
    private String hrComment;

}
