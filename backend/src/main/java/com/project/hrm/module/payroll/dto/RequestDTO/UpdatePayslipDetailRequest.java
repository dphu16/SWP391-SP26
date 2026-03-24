package com.project.hrm.module.payroll.dto.RequestDTO;

import com.project.hrm.module.payroll.enums.PayslipDetailType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * UR_HR004: HR chỉnh sửa thủ công chi tiết phiếu lương (allowance/deduction).
 * Gửi lên danh sách đầy đủ - sẽ thay thế toàn bộ details hiện tại.
 */
@Data
public class UpdatePayslipDetailRequest {

    @NotNull
    @Valid
    private List<DetailItem> details;

    @Data
    public static class DetailItem {
        @NotNull
        private String itemName;

        @NotNull
        private BigDecimal amount;

        @NotNull
        private PayslipDetailType type;
    }
}
