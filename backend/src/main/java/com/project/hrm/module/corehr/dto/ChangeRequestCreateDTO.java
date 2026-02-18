package com.project.hrm.module.corehr.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangeRequestCreateDTO {

    @Pattern(regexp = "^(\\+84|0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])\\d{7}$", message = "Phone number must be a valid Vietnamese phone number")
    private String phone;

    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String address;

    @Pattern(regexp = "^\\d{9,12}$", message = "Citizen ID must be 9 to 12 digits")
    private String citizenId;

    @Pattern(regexp = "^\\d{10}(-\\d{3})?$", message = "Tax code must follow Vietnamese format (10 digits, optionally followed by -XXX)")
    private String taxCode;

    @Email(message = "Personal email must be a valid email address")
    @Size(max = 100, message = "Personal email must not exceed 100 characters")
    private String personalEmail;
}
