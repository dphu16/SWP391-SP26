package com.project.hrm.module.corehr.service.AI;

/**
 * Mapping field name (camelCase) ↔ label tiếng Việt.
 * Tách ra để AIChatService không bị phình thêm khi thêm field mới.
 */
public final class ContractFieldMeta {

    private ContractFieldMeta() {}

    public static String label(String fieldName) {
        return switch (fieldName) {
            case "fullName"       -> "Họ tên";
            case "phone"          -> "Số điện thoại";
            case "email"          -> "Email";
            case "gender"         -> "Giới tính";
            case "address"        -> "Địa chỉ";
            case "citizenId"      -> "CCCD/CMND";
            case "taxCode"        -> "Mã số thuế";
            case "dateOfBirth"    -> "Ngày sinh";
            case "baseSalary"     -> "Lương cơ bản";
            case "contractNumber" -> "Số hợp đồng";
            case "startDate"      -> "Ngày bắt đầu";
            case "endDate"        -> "Ngày kết thúc";
            case "dateOfJoining"  -> "Ngày vào làm";
            case "departmentName" -> "Phòng ban";
            case "positionName"   -> "Chức vụ";
            default               -> fieldName;
        };
    }
}
