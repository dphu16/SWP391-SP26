package com.project.hrm.module.corehr.mapper;

import com.project.hrm.module.corehr.dto.response.OnboardingResponseDTO;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.entity.Personal;
import com.project.hrm.module.corehr.entity.Position;
import com.project.hrm.module.corehr.entity.User;
import com.project.hrm.module.recruitment.entity.Application;
import com.project.hrm.module.recruitment.entity.Candidate;
import com.project.hrm.module.recruitment.entity.Job;
import com.project.hrm.module.corehr.enums.ProgressStatus;
import com.project.hrm.module.recruitment.enums.ApplicationStatus;

public class OnboardingMapper {

    public static OnboardingResponseDTO toDTO(Application application) {
        Candidate candidate = application.getCandidate();
        Job job = application.getJob();

        return OnboardingResponseDTO.builder()
                .id(application.getId())
                .candidateName(candidate != null ? candidate.getFullName() : null)
                .candidateEmail(candidate != null ? candidate.getEmail() : null)
                .candidatePhone(candidate != null ? candidate.getPhone() : null)
                .jobTitle(job != null ? job.getTitle() : null)
                .status(application.getStatus())
                .progressStatus(application.getStatus() == ApplicationStatus.HIRED ? ProgressStatus.NEW : null)
                .build();
    }

    public static OnboardingResponseDTO fromEmployee(Employee employee) {
        return fromEmployee(employee, null);
    }

    public static OnboardingResponseDTO fromEmployee(Employee employee, String rejectionReason) {
        User user = employee.getUser();
        Personal personal = employee.getPersonal();
        Position position = employee.getPosition();

        return OnboardingResponseDTO.builder()
                .id(employee.getEmployeeId())
                .candidateName(employee.getFullName())
                .candidateEmail(user != null ? user.getEmail() : null)
                .candidatePhone(personal != null ? personal.getPhone() : null)
                .jobTitle(position != null ? position.getTitle() : null)
                .status(null)
                .progressStatus(employee.getEmpStatus())
                .rejectionReason(rejectionReason)
                .build();
    }
}