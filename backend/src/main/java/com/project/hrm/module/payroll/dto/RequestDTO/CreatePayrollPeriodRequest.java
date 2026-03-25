package com.project.hrm.module.payroll.dto.RequestDTO;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreatePayrollPeriodRequest {

    @NotNull(message = "Tháng không được để trống")
    @Min(value = 1, message = "Tháng phải từ 1 đến 12")
    @Max(value = 12, message = "Tháng phải từ 1 đến 12")
    private Integer month;

    @NotNull(message = "Năm không được để trống")
    @Min(value = 2000, message = "Năm phải từ 2000 trở đi")
    private Integer year;

    /**
     * Bug Fix #4: Thêm startDate / endDate.
     * Nếu không điền, backend tự tính: startDate = ngày 1 của tháng/năm,
     * endDate = ngày cuối của tháng/năm.
     * HR có thể ghi đè nếu kỳ lương có biên tuỳ chỉnh (VD: 16/3 - 15/4).
     */
    private LocalDate startDate;

    private LocalDate endDate;

}
