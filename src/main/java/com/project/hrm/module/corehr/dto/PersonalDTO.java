package com.project.hrm.module.corehr.dto;

import com.project.hrm.module.corehr.enums.Gender;
import com.project.hrm.module.corehr.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PersonalDTO {

    private String username;
    private String email;
    private String phone;
    private String address;
    private UserStatus statusPos = UserStatus.ACTIVE;
    private String fullName;
    private Gender gender;
    private String citizenId;
    private String taxCode;
    private LocalDate dateOfBirth;
    private LocalDate dateOfJoining;
}
