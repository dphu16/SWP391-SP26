package com.project.hrm.module.corehr.repository.specification;

import com.project.hrm.module.corehr.entity.Employee;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public class EmployeeSpecification {

    public static Specification<Employee> filterEmployees(String fullName, String employeeCode, String phoneNumber,
            String department, String position, String role, String status) {
        return (root, query, criteriaBuilder) -> {
            var predicate = criteriaBuilder.conjunction();

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
                var personalJoin = root.join("personal");
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.like(personalJoin.get("phone"), "%" + phoneNumber.trim() + "%"));
            }

            if (StringUtils.hasText(department)) {
                var deptJoin = root.join("department");
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.equal(deptJoin.get("deptName"), department.trim()));
            }

            if (StringUtils.hasText(position)) {
                var posJoin = root.join("position");
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.equal(posJoin.get("title"), position.trim()));
            }

            if (StringUtils.hasText(role)) {
                var userJoin = root.join("user");

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
                try {
                    com.project.hrm.module.corehr.enums.EmployeeStatus parsedStatus = com.project.hrm.module.corehr.enums.EmployeeStatus
                            .valueOf(status.trim().toUpperCase());
                    predicate = criteriaBuilder.and(predicate,
                            criteriaBuilder.equal(root.get("empStatus"), parsedStatus));
                } catch (IllegalArgumentException e) {
                    // Ignore Invalid status string
                }
            }

            return predicate;
        };
    }
}
