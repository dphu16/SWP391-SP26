package com.project.hrm.module.evaluation.controller;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.evaluation.dto.EvidenceStatusRequest;
import com.project.hrm.module.evaluation.dto.MenteeDTO;
import com.project.hrm.module.evaluation.dto.MentorAssessmentRequest;
import com.project.hrm.module.evaluation.entity.GoalEvidence;
import com.project.hrm.module.evaluation.entity.MentorAssessment;
import com.project.hrm.module.evaluation.service.MentorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/mentor")
@RequiredArgsConstructor
public class MentorController {

    private final MentorService mentorService;

    @GetMapping("/mentees/{mentorId}")
    public ResponseEntity<List<MenteeDTO>> getMentees(@PathVariable("mentorId") UUID mentorId) {
        return ResponseEntity.ok(mentorService.getMenteesByMentor(mentorId));
    }

    @GetMapping("/goal/{goalId}/evidences")
    public ResponseEntity<List<GoalEvidence>> getEvidences(@PathVariable("goalId") UUID goalId) {
        return ResponseEntity.ok(mentorService.getEvidencesByGoal(goalId));
    }

    @PatchMapping("/evidence/{evidenceId}/status")
    public ResponseEntity<GoalEvidence> updateEvidenceStatus(
            @PathVariable("evidenceId") UUID evidenceId,
            @RequestBody EvidenceStatusRequest request) {
        return ResponseEntity.ok(mentorService.updateEvidenceStatus(evidenceId, request));
    }

    @PostMapping("/assess/{mentorId}")
    public ResponseEntity<MentorAssessment> submitAssessment(
            @PathVariable("mentorId") UUID mentorId,
            @RequestBody MentorAssessmentRequest request) {
        return ResponseEntity.ok(mentorService.submitAssessment(mentorId, request));
    }

    @GetMapping("/review/{reviewId}/assessment")
    public ResponseEntity<MentorAssessment> getAssessment(@PathVariable("reviewId") UUID reviewId) {
        return ResponseEntity.ok(mentorService.getAssessmentByReview(reviewId));
    }
}
