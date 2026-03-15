package com.project.hrm.module.corehr.service.offboarding;

import com.project.hrm.module.corehr.dto.request.CancelOffboardingDTO;
import com.project.hrm.module.corehr.dto.request.EmployeeDetailDTO;
import com.project.hrm.module.corehr.dto.request.HRConfirmOffboardingDTO;
import com.project.hrm.module.corehr.dto.request.OffboardingRequestDTO;
import com.project.hrm.module.corehr.dto.response.InactiveEmployeeResponseDTO;
import com.project.hrm.module.corehr.dto.response.OffboardingResponseDTO;

import java.util.List;
import java.util.UUID;

public interface IOffboardingService {

    /** Nhân viên tự tạo yêu cầu nghỉ việc (voluntary resignation) */
    OffboardingResponseDTO createResignationRequest(UUID employeeId, OffboardingRequestDTO dto, UUID requestedBy);

    /** Quản lý đề xuất sa thải / hết HĐ / không vào làm */
    OffboardingResponseDTO createManagerProposedRequest(UUID employeeId, OffboardingRequestDTO dto, UUID managerId);

    /** Quản lý duyệt yêu cầu nghỉ tự nguyện */
    OffboardingResponseDTO managerApprove(UUID offboardingId, UUID managerId);

    /** HR điền ngày nghỉ chính thức & xác nhận */
    OffboardingResponseDTO hrConfirm(UUID offboardingId, HRConfirmOffboardingDTO dto, UUID hrEmployeeId);

    /** Hủy yêu cầu offboarding (HR, Manager, hoặc Employee) */
    OffboardingResponseDTO cancelOffboarding(UUID offboardingId, CancelOffboardingDTO dto, UUID cancelledBy);

    List<OffboardingResponseDTO> getActiveRequests();

    List<OffboardingResponseDTO> getPendingRequests();

    OffboardingResponseDTO getOffboardingById(UUID offboardingId);

    List<InactiveEmployeeResponseDTO> getInactiveEmployees();

    EmployeeDetailDTO terminateEmployee(UUID id);

    EmployeeDetailDTO activateEmployee(UUID id);
}
