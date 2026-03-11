package com.project.hrm.module.recruitment.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class PositionResponse {
    private UUID posId;
    private String posName;
}
