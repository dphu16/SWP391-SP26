package com.project.hrm.recruitment.dto.request;

import com.project.hrm.recruitment.enums.RequestStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StatusReqRequest {

    private RequestStatus status;
    private String hrComment;

}
