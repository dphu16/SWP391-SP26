package com.project.hrm.module.payroll.dto.ResponseDTO;

import com.project.hrm.module.payroll.enums.PayslipDetailType;
import com.project.hrm.module.payroll.enums.PayslipStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class PayslipResponse {

    private UUID payslipId;
    private UUID employeeId;
    private String employeeName;
    private String departmentName;

    // Thông tin ngân hàng (tự động lấy từ CoreHR)
    private String bankName;
    private String accountNumber;
    private String accountHolderName;
    private String branchName;
    private UUID batchId;
    private UUID periodId;
    private Integer month;
    private Integer year;

    // Chấm công
    private BigDecimal totalOtHours;
    private BigDecimal totalAbsentDays;
    private BigDecimal totalWorkDays;

    // Lương
    private BigDecimal baseSalary;
    private BigDecimal otPay;
    private BigDecimal absentDeduction;
    private BigDecimal totalAllowances;
    private BigDecimal grossSalary;
    private BigDecimal taxAmount;
    private BigDecimal insuranceAmount;
    private BigDecimal totalDeductions;
    private BigDecimal netSalary;

    private PayslipStatus status;
    private List<DetailItem> details;
    private OffsetDateTime confirmedAt;
    private OffsetDateTime paidAt;
    private OffsetDateTime createdAt;

    @Data
    @Builder
    public static class DetailItem {
        private String itemName;
        private BigDecimal amount;
        private PayslipDetailType type;
    }
}
