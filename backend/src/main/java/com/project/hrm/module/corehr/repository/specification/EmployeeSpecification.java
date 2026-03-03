package com.project.hrm.module.corehr.repository.specification;

import com.project.hrm.module.corehr.entity.Employee;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import jakarta.persistence.criteria.*;

public class EmployeeSpecification {

    public static Specification<Employee> filterEmployees(String fullName, String employeeCode, String phoneNumber,
            String department, String position, String role, String status) {
        return (root, query, criteriaBuilder) -> {
            Predicate predicate = criteriaBuilder.conjunction();

            if (StringUtils.hasText(fullName)) {
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("fullName")),
                                "%" + fullName.trim().toLowerCase() + "%"));
            }

            if (StringUtils.hasText(employeeCode)) {
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.equal(root.get("employeeCode"), employeeCode.trim()));
            }

            if (StringUtils.hasText(phoneNumber)) {
                Join<Object, Object> personalJoin = root.join("personal");
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.like(personalJoin.get("phone"), "%" + phoneNumber.trim() + "%"));
            }

            if (StringUtils.hasText(department)) {
                Join<Object, Object> deptJoin = root.join("department");
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.equal(deptJoin.get("deptName"), department.trim()));
            }

            if (StringUtils.hasText(position)) {
                Join<Object, Object> posJoin = root.join("position");
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.equal(posJoin.get("title"), position.trim()));
            }

            if (StringUtils.hasText(role)) {
                Join<Object, Object> userJoin = root.join("user");

                String roleEnumStr = role.trim().toUpperCase();
                if (roleEnumStr.equals("HR MANAGER") || roleEnumStr.equals("HR")) {
                    roleEnumStr = "HR";
                }

                try {
                    com.project.hrm.module.corehr.enums.UserRole parsedRole = com.project.hrm.module.corehr.enums.UserRole
                            .valueOf(roleEnumStr);
                    predicate = criteriaBuilder.and(predicate,
                            criteriaBuilder.equal(userJoin.get("role"), parsedRole));
                } catch (IllegalArgumentException e) {
                    // Ignore Invalid role string
                }
            }

            if (StringUtils.hasText(status)) {
                String statusStr = status.trim().toUpperCase();
                boolean parsed = false;
                try {
                    com.project.hrm.module.corehr.enums.EmployeeStatus parsedStatus = com.project.hrm.module.corehr.enums.EmployeeStatus
                            .valueOf(statusStr);
                    predicate = criteriaBuilder.and(predicate,
                            criteriaBuilder.equal(root.get("empStatus"), parsedStatus));
                    parsed = true;
                } catch (IllegalArgumentException e) {
                    // Ignore Invalid status string
                }

                if (!parsed) {
                    try {
                        com.project.hrm.module.corehr.enums.UserStatus parsedUserStatus = com.project.hrm.module.corehr.enums.UserStatus
                                .valueOf(statusStr);
                        Join<Object, Object> userJoinForStatus = root.join("user");
                        predicate = criteriaBuilder.and(predicate,
                                criteriaBuilder.equal(userJoinForStatus.get("status"), parsedUserStatus));
                    } catch (IllegalArgumentException e) {
                        // Ignore Invalid status string
                    }
                }
            }

            return predicate;
        };
    }
}
