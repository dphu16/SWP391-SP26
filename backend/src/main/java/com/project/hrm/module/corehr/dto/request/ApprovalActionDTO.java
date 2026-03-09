package com.project.hrm.module.corehr.dto.request;

import com.project.hrm.module.request.enums.RequestStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ApprovalActionDTO {

    @NotNull
    private RequestStatus action;
    private String reason;
}
