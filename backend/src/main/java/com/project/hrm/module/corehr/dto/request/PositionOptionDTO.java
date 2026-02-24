package com.project.hrm.module.corehr.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class PositionOptionDTO {

    private UUID id;

    private String title;
}
