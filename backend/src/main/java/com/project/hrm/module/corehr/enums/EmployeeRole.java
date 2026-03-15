package com.project.hrm.module.corehr.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum EmployeeRole {
    ROLE_ADMIN,
    ROLE_MENTOR,
    ROLE_MANAGER,
    ROLE_EMPLOYEE,
    ROLE_HR,
    ROLE_FINANCE,
    ROLE_INTERN;

    @JsonCreator
    public static EmployeeRole from(String value) {
        if (value == null)
            return null;
        String upper = value.toUpperCase();
        if (!upper.startsWith("ROLE_")) {
            upper = "ROLE_" + upper;
        }
        return EmployeeRole.valueOf(upper);
    }

    @JsonValue
    public String toJson() {
        return this.name();
    }
}