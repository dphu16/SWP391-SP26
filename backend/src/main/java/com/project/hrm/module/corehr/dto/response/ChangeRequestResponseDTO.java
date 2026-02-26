
package com.project.hrm.module.corehr.dto.response;

import com.project.hrm.module.corehr.enums.RequestStatus;
import com.project.hrm.module.corehr.enums.RequestType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangeRequestResponseDTO {

    private UUID id;

    private RequestType type;

    private String reason;

    private Map<String, Object> requestData;

    private RequestStatus status;

    private OffsetDateTime createdAt;
}
