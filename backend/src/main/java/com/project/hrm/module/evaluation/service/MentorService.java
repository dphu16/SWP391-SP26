package com.project.hrm.module.evaluation.service;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.evaluation.dto.EvidenceStatusRequest;
import com.project.hrm.module.evaluation.dto.MenteeDTO;
import com.project.hrm.module.evaluation.dto.MentorAssessmentRequest;
import com.project.hrm.module.evaluation.entity.GoalEvidence;
import com.project.hrm.module.evaluation.entity.MentorAssessment;
import com.project.hrm.module.evaluation.entity.PerformanceReviews;
import com.project.hrm.module.evaluation.repository.EmployeeGoalRepository;
import com.project.hrm.module.evaluation.repository.GoalEvidenceRepository;
import com.project.hrm.module.evaluation.repository.MentorAssessmentRepository;
import com.project.hrm.module.evaluation.repository.PerformanceReviewsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MentorService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeGoalRepository employeeGoalRepository;
    private final GoalEvidenceRepository evidenceRepository;
    private final MentorAssessmentRepository assessmentRepository;
    private final PerformanceReviewsRepository reviewRepository;

    public List<MenteeDTO> getMenteesByMentor(UUID mentorId) {
        Employee mentor = employeeRepository.findById(mentorId)
                .orElseThrow(() -> new RuntimeException("Mentor not found"));
        
        if (mentor.getDepartment() == null) {
            return java.util.Collections.emptyList();
        }

        UUID deptId = mentor.getDepartment().getDeptId();
        
        // Return all employees in the same department, excluding the mentor themselves
        return employeeRepository.findByDepartment_DeptId(deptId).stream()
                .filter(e -> !e.getEmployeeId().equals(mentorId))
                .map(e -> MenteeDTO.builder()
                        .employeeId(e.getEmployeeId())
                        .fullName(e.getFullName())
                        .positionTitle(e.getPosition() != null ? e.getPosition().getTitle() : null)
                        .avatarUrl(e.getPersonal() != null ? e.getPersonal().getAvatar() : null)
                        .build())
                .toList();
    }

    public List<GoalEvidence> getEvidencesByGoal(UUID goalId) {
        List<GoalEvidence> evidences = evidenceRepository.findByGoal_GoalId(goalId);
        
        // Backward compatibility: If no GoalEvidence rows exist but EmployeeGoal has an imageUrl, wrap it.
        if (evidences.isEmpty()) {
            com.project.hrm.module.evaluation.entity.EmployeeGoal goal = employeeGoalRepository.findById(goalId).orElse(null);
            if (goal != null && goal.getImageUrl() != null && !goal.getImageUrl().isBlank()) {
                GoalEvidence legacyEvidence = new GoalEvidence();
                legacyEvidence.setGoal(goal);
                legacyEvidence.setFileUrl(goal.getImageUrl());
                legacyEvidence.setStatus(com.project.hrm.module.evaluation.enums.EvidenceStatus.PENDING);
                
                // Save it to database so it can be approved/rejected
                GoalEvidence saved = evidenceRepository.save(legacyEvidence);
                return List.of(saved);
            }
        }
        
        return evidences;
    }

    @Transactional
    public GoalEvidence updateEvidenceStatus(UUID evidenceId, EvidenceStatusRequest request) {
        GoalEvidence evidence = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new RuntimeException("Evidence not found"));
        evidence.setStatus(request.getStatus());
        evidence.setMentorComment(request.getComment());
        
        // Update parent Goal status based on the mentor's decision
        com.project.hrm.module.evaluation.entity.EmployeeGoal goal = evidence.getGoal();
        if (request.getStatus() == com.project.hrm.module.evaluation.enums.EvidenceStatus.APPROVED) {
            goal.setStatus(com.project.hrm.module.evaluation.enums.GoalStatus.COMPLETED);
        } else if (request.getStatus() == com.project.hrm.module.evaluation.enums.EvidenceStatus.REJECTED) {
            goal.setStatus(com.project.hrm.module.evaluation.enums.GoalStatus.ACKNOWLEDGED);
        }
        employeeGoalRepository.save(goal);
        
        return evidenceRepository.save(evidence);
    }

    @Transactional
    public MentorAssessment submitAssessment(UUID mentorId, MentorAssessmentRequest request) {
        PerformanceReviews review = reviewRepository.findByEmployee_EmployeeIdAndCycle_CycleId(
                request.getEmployeeId(), request.getCycleId())
                .orElseThrow(() -> new RuntimeException("Active review not found for this employee/cycle"));

        MentorAssessment assessment = assessmentRepository.findByReview_ReviewId(review.getReviewId())
                .orElse(new MentorAssessment());

        assessment.setReview(review);
        assessment.setTeamworkScore(request.getTeamworkScore());
        assessment.setCommunicationScore(request.getCommunicationScore());
        assessment.setTechnicalScore(request.getTechnicalScore());
        assessment.setAdaptabilityScore(request.getAdaptabilityScore());
        
        Employee mentor = employeeRepository.findById(mentorId)
                .orElseThrow(() -> new RuntimeException("Mentor not found"));
        assessment.setMentor(mentor);

        assessment.calculateAverage();
        MentorAssessment saved = assessmentRepository.save(assessment);

        // Update attitudeScore in PerformanceReviews (weighted 30% of total, but here we store the raw avg)
        review.setAttitudeScore(saved.getAverageScore());
        reviewRepository.save(review);

        return saved;
    }

    public MentorAssessment getAssessmentByReview(UUID reviewId) {
        return assessmentRepository.findByReview_ReviewId(reviewId).orElse(null);
    }
}
