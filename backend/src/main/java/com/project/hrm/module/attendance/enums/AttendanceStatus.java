package com.project.hrm.module.attendance.enums;

public enum AttendanceStatus {
    VALID,          // On time
    LATE,
    EARLY_LEAVE,
    MISSING_PUNCH,   // Checked in but not yet checked out
    LATE_EARLY, // Thêm dòng này
}
