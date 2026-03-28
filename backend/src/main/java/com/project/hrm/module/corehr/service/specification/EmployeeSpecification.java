package com.project.hrm.module.corehr.service.specification;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.enums.EmployeeRole;
import com.project.hrm.module.corehr.enums.EmployeeStatus;
import com.project.hrm.module.corehr.enums.ProgressStatus;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.UUID;

public class EmployeeSpecification {

    public static Specification<Employee> filterEmployees(String q, String fullName, String employeeCode, String phoneNumber,
                                                          String department, String position, String role, String status, UUID deptId) {
        return (root, query, criteriaBuilder) -> {
            if (query != null) {
                query.distinct(true); // Prevent duplicate rows from @EntityGraph JOIN on user.roles (@ManyToMany)
            }
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
                // unaccent để tìm "bich" ra "Bích", "nguyen van a" ra "Nguyễn Văn A"
                String searchName = "%" + fullName.trim().toLowerCase() + "%";
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.like(
                                criteriaBuilder.function("unaccent", String.class,
                                        criteriaBuilder.lower(root.get("fullName"))),
                                criteriaBuilder.function("unaccent", String.class,
                                        criteriaBuilder.literal(searchName))
                        ));
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
                Join<Object, Object> deptJoin = root.join("department", JoinType.LEFT);
                String searchDept = "%" + department.trim().toLowerCase() + "%";
                // LIKE thay vì equal → "ke toan" tìm ra "Kế Toán", "IT" tìm ra "Công nghệ thông tin"
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.like(
                                criteriaBuilder.function("unaccent", String.class,
                                        criteriaBuilder.lower(deptJoin.get("deptName"))),
                                criteriaBuilder.function("unaccent", String.class,
                                        criteriaBuilder.literal(searchDept))
                        ));
            }
            
            if (deptId != null) {
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.equal(root.get("department").get("deptId"), deptId));
            }

            if (StringUtils.hasText(position)) {
                Join<Object, Object> posJoin = root.join("position", JoinType.LEFT);
                String searchPos = "%" + position.trim().toLowerCase() + "%";
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.like(
                                criteriaBuilder.function("unaccent", String.class,
                                        criteriaBuilder.lower(posJoin.get("title"))),
                                criteriaBuilder.function("unaccent", String.class,
                                        criteriaBuilder.literal(searchPos))
                        ));
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
                String statusStr = status.trim().toUpperCase();
                boolean matched = false;

                // Try EmployeeStatus (OFFICIAL, TERMINATED, etc.)
                try {
                    EmployeeStatus empStatusEnum = EmployeeStatus.valueOf(statusStr);
                    predicate = criteriaBuilder.and(predicate,
                            criteriaBuilder.equal(root.get("status"), empStatusEnum));
                    matched = true;
                } catch (IllegalArgumentException ignored) {}

                // Try ProgressStatus (NEW, COMPLETED, etc.) if not matched yet
                if (!matched) {
                    try {
                        ProgressStatus progStatusEnum = ProgressStatus.valueOf(statusStr);
                        predicate = criteriaBuilder.and(predicate,
                                criteriaBuilder.equal(root.get("empStatus"), progStatusEnum));
                    } catch (IllegalArgumentException ignored) {}
                }
            } else {
                // No status filter specified → exclude PENDING_OFFBOARD and TERMINATED by default
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.not(root.get("status").in(EmployeeStatus.PENDING_OFFBOARD, EmployeeStatus.TERMINATED)));
            }

            return predicate;
        };
    }
}