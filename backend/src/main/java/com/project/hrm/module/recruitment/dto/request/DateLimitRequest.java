package com.project.hrm.module.recruitment.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
public class DateLimitRequest {
    private UUID id;
    private OffsetDateTime start;
    private OffsetDateTime end;
}
