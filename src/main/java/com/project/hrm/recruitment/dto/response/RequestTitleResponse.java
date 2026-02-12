package com.project.hrm.recruitment.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class RequestTitleResponse {

    private UUID requestId;
    private String requestTitle;
    private UUID deptId;
    private String deptName;

}
