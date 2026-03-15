package com.project.hrm.module.attendance.enums;

public enum AttendanceStatus {
    VALID,          // On time
    LATE,           // Checked in after grace period
    EARLY_LEAVE,    // Checked out before shift end
    MISSING_PUNCH   // Checked in but not yet checked out
}
