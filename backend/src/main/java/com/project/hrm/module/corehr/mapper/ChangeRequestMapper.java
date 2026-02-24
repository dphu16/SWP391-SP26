package com.project.hrm.module.corehr.mapper;

import com.project.hrm.module.corehr.dto.request.ChangeRequestCreateDTO;
import com.project.hrm.module.corehr.dto.response.ChangeRequestResponseDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.Request;
import com.project.hrm.module.corehr.enums.RequestType;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

public class ChangeRequestMapper {

    private ChangeRequestMapper() {
    }

    public static Map<String, Object> buildOldData(Employee employee, ChangeRequestCreateDTO dto) {
        Map<String, Object> oldData = new LinkedHashMap<>();

        if (dto.getType() == RequestType.CHANGE_OF_INFORMATION) {
            if (dto.getCitizenId() != null)
                oldData.put("citizenId", employee.getPersonal().getCitizenId());
            if (dto.getTaxCode() != null)
                oldData.put("taxCode", employee.getPersonal().getTaxCode());
        }

        if (dto.getType() == RequestType.CHANGE_OF_POSITION) {
            if (employee.getPosition() != null)
                oldData.put("positionId", employee.getPosition().getPositionId().toString());
            if (employee.getDepartment() != null)
                oldData.put("departmentId", employee.getDepartment().getDeptId().toString());
        }

        return oldData;
    }

    public static Map<String, Object> buildNewData(ChangeRequestCreateDTO dto) {
        Map<String, Object> newData = new LinkedHashMap<>();

        if (dto.getType() == RequestType.CHANGE_OF_INFORMATION) {
            if (dto.getCitizenId() != null)
                newData.put("citizenId", dto.getCitizenId());
            if (dto.getTaxCode() != null)
                newData.put("taxCode", dto.getTaxCode());
        }

        if (dto.getType() == RequestType.CHANGE_OF_POSITION) {
            if (dto.getNewPositionId() != null)
                newData.put("positionId", dto.getNewPositionId());
            if (dto.getNewDepartmentId() != null)
                newData.put("departmentId", dto.getNewDepartmentId());
        }

        return newData;
    }

    public static boolean isDataUnchanged(Map<String, Object> oldData, Map<String, Object> newData) {
        if (newData.isEmpty())
            return false;
        if (oldData.size() != newData.size())
            return false;
        for (Map.Entry<String, Object> entry : newData.entrySet()) {
            if (!Objects.equals(oldData.get(entry.getKey()), entry.getValue()))
                return false;
        }
        return true;
    }

    public static ChangeRequestResponseDTO toResponseDTO(Request entity) {
        return ChangeRequestResponseDTO.builder()
                .id(entity.getRequestId())
                .type(entity.getType())
                .reason(entity.getReason())
                .requestData(entity.getRequestData())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
