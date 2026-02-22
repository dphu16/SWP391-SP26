package com.project.hrm.module.corehr.mapper;

import com.project.hrm.module.corehr.dto.ChangeRequestCreateDTO;
import com.project.hrm.module.corehr.ResponseDTO.ChangeRequestResponseDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.EmployeeChangeRequest;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

public class ChangeRequestMapper {

    private ChangeRequestMapper() {
    }

    public static Map<String, Object> buildOldData(Employee employee, ChangeRequestCreateDTO dto) {
        Map<String, Object> oldData = new LinkedHashMap<>();

        if (dto.getCitizenId() != null) {
            oldData.put("citizenId", employee.getCitizenId());
        }
        if (dto.getTaxCode() != null) {
            oldData.put("taxCode", employee.getTaxCode());
        }
        return oldData;
    }

    public static Map<String, Object> buildNewData(ChangeRequestCreateDTO dto) {
        Map<String, Object> newData = new LinkedHashMap<>();

        if (dto.getCitizenId() != null) {
            newData.put("citizenId", dto.getCitizenId());
        }
        if (dto.getTaxCode() != null) {
            newData.put("taxCode", dto.getTaxCode());
        }
        return newData;
    }

    public static boolean isDataUnchanged(Map<String, Object> oldData, Map<String, Object> newData) {
        if (oldData.size() != newData.size()) {
            return false;
        }

        for (Map.Entry<String, Object> entry : newData.entrySet()) {
            Object oldValue = oldData.get(entry.getKey());
            if (!Objects.equals(oldValue, entry.getValue())) {
                return false;
            }
        }

        return true;
    }

    public static ChangeRequestResponseDTO toResponseDTO(EmployeeChangeRequest entity) {
        return ChangeRequestResponseDTO.builder()
                .id(entity.getId())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
