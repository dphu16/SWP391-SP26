package com.project.hrm.module.corehr.service.specification;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.enums.EmployeeRole;
import com.project.hrm.module.corehr.enums.ProgressStatus;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public class EmployeeSpecification {

    public static Specification<Employee> filterEmployees(String q, String fullName, String employeeCode, String phoneNumber,
                                                          String department, String position, String role, String status) {
        return (root, query, criteriaBuilder) -> {
            Predicate predicate = criteriaBuilder.conjunction();

            if (StringUtils.hasText(q)) {
                String searchTerm = "%" + q.trim().toLowerCase() + "%";
                Join<Object, Object> personalJoin = root.join("personal", JoinType.LEFT);
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.or(
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("fullName")), searchTerm),
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("employeeCode")), searchTerm),
                                criteriaBuilder.like(criteriaBuilder.lower(personalJoin.get("email")), searchTerm),
                                criteriaBuilder.like(criteriaBuilder.lower(personalJoin.get("phone")), searchTerm)
                        ));
            }

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
                Join<Object, Object> rolesJoin = userJoin.join("roles");

                String roleEnumStr = role.trim().toUpperCase();
                if (!roleEnumStr.startsWith("ROLE_")) {
                    roleEnumStr = "ROLE_" + roleEnumStr;
                }

                try {
                    EmployeeRole parsedRole = EmployeeRole.valueOf(roleEnumStr);
                    predicate = criteriaBuilder.and(predicate,
                            criteriaBuilder.equal(rolesJoin.get("name"), parsedRole));
                } catch (IllegalArgumentException e) {
                    // Ignore Invalid role string
                }
            }

            if (StringUtils.hasText(status)) {
                try {
                    ProgressStatus parsedStatus = ProgressStatus
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