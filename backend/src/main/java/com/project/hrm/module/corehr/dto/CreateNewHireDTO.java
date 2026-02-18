package com.project.hrm.module.corehr.dto;

import com.project.hrm.module.corehr.enums.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateNewHireDTO {

    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;

    private String phone;

    @Email(message = "Email không hợp lệ")
    private String email;

    private Gender gender;

    private String address;

    @NotNull(message = "Phòng ban không được để trống")
    private UUID departmentId;

    @NotNull(message = "Vị trí không được để trống")
    private UUID positionId;

    private String citizenId;

    private String taxCode;

    private LocalDate dateOfBirth;

    private String avatarUrl;

    /**
     * ID của hồ sơ ứng viên (application) trong module tuyển dụng.
     * Nếu được cung cấp, hồ sơ này sẽ bị xóa sau khi tạo nhân viên thành công.
     */
    private UUID sourceApplicationId;
}
