package com.project.hrm.module.corehr.service.offboarding;

import com.project.hrm.module.corehr.dto.response.InactiveEmployeeResponseDTO;
import com.project.hrm.module.corehr.dto.response.OffboardingResponseDTO;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.OffboardingStatus;
import com.project.hrm.module.corehr.exception.BusinessRuleException;
import com.project.hrm.module.corehr.enums.ErrorCode;
import com.project.hrm.module.corehr.mapper.InactiveEmployeeMapper;
import com.project.hrm.module.corehr.mapper.OffboardingMapper;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.corehr.repository.OffboardingRepository;
import com.project.hrm.module.corehr.entity.Offboarding;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class OffboardingQueryService {

        private final EmployeeRepository employeeRepository;
        private final OffboardingRepository offboardingRepository;

        public OffboardingQueryService(EmployeeRepository employeeRepository,
                        OffboardingRepository offboardingRepository) {
                this.employeeRepository = employeeRepository;
                this.offboardingRepository = offboardingRepository;
        }

        public List<InactiveEmployeeResponseDTO> getInactiveEmployees() {
                List<EmployeeStatus> inactiveStatuses = List.of(
                                EmployeeStatus.TERMINATED,
                                EmployeeStatus.RESIGNED,
                                EmployeeStatus.PENDING_OFFBOARD);

                return employeeRepository.findByStatusIn(inactiveStatuses)
                                .stream()
                                .map(InactiveEmployeeMapper::toDTO)
                                .toList();
        }

        /** Lấy tất cả request đang active (PENDING, MANAGER_APPROVED, HR_CONFIRMED) */
        public List<OffboardingResponseDTO> getActiveRequests(UUID deptId) {
                List<OffboardingStatus> activeStatuses = List.of(
                                OffboardingStatus.PENDING,
                                OffboardingStatus.MANAGER_APPROVED,
                                OffboardingStatus.HR_CONFIRMED);

                List<Offboarding> entities;
                if (deptId != null) {
                        entities = offboardingRepository.findByStatusInAndEmployee_Department_DeptId(activeStatuses, deptId);
                } else {
                        entities = offboardingRepository.findByStatusIn(activeStatuses);
                }

                return entities.stream()
                                .map(o -> OffboardingMapper.toDTO(o, employeeRepository))
                                .toList();
        }

        /** Lấy chỉ request PENDING (chờ Manager duyệt) */
        public List<OffboardingResponseDTO> getPendingRequests(UUID deptId) {
                List<OffboardingStatus> statuses = List.of(OffboardingStatus.PENDING);
                List<Offboarding> entities;
                if (deptId != null) {
                        entities = offboardingRepository.findByStatusInAndEmployee_Department_DeptId(statuses, deptId);
                } else {
                        entities = offboardingRepository.findByStatusIn(statuses);
                }

                return entities.stream()
                                .map(o -> OffboardingMapper.toDTO(o, employeeRepository))
                                .toList();
        }

        public OffboardingResponseDTO getOffboardingById(UUID offboardingId) {
                return offboardingRepository.findByOffboardingId(offboardingId)
                                .map(o -> OffboardingMapper.toDTO(o, employeeRepository))
                                .orElseThrow(() -> new BusinessRuleException(ErrorCode.OFFBOARDING_NOT_FOUND,
                                                "Offboarding request not found: " + offboardingId));
        }
}
