package com.project.hrm.recruitment.dto.request;

import com.project.hrm.recruitment.enums.InterviewStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StatusInterRequest {

    private InterviewStatus status;
    private String feedback;

}
