
package com.project.hrm.module.corehr.dto.request;

import com.project.hrm.module.corehr.enums.RequestType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangeRequestCreateDTO {

    @NotNull(message = "Request type is required")
    private RequestType type;

    private String reason;

    // Fields for CHANGE_OF_INFOMATION
    @Pattern(regexp = "^\\d{9,12}$", message = "Citizen ID must be 9 to 12 digits")
    private String citizenId;

    @Pattern(regexp = "^\\d{10}(-\\d{3})?$", message = "Tax code must follow Vietnamese format")
    private String taxCode;

    // Fields for CHANGE_OF_POSITION (future use — stored in requestData jsonb)
    private String newPositionId;
    private String newDepartmentId;
}
