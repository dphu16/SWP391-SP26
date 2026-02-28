package com.project.hrm.module.payroll.dto.RequestDTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO trả về thông tin cơ bản của một PayrollBatch (dùng cho dropdown chọn
 * batch)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PayrollBatchDTO {
    private UUID batchId;
    private LocalDate period; // VD: 2026-02-01
    private String status; // DRAFT | PROCESSED | VALIDATED | LOCKED
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;

    /**
     * Label thân thiện để hiển thị trên dropdown, VD: "Tháng 02/2026 — PROCESSED"
     */
    public String getLabel() {
        if (period == null)
            return batchId.toString();
        return String.format("Tháng %02d/%d — %s", period.getMonthValue(), period.getYear(),
                status != null ? status : "UNKNOWN");
    }
}
