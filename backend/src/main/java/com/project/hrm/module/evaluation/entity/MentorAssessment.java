package com.project.hrm.module.evaluation.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.project.hrm.module.corehr.entity.Employee;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "mentor_assessments")
@Data
public class MentorAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "assessment_id")
    private UUID assessmentId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private PerformanceReviews review;

    @Column(name = "teamwork_score")
    private Double teamworkScore;

    @Column(name = "communication_score")
    private Double communicationScore;

    @Column(name = "technical_score")
    private Double technicalScore;

    @Column(name = "adaptability_score")
    private Double adaptabilityScore;

    @Column(name = "average_score")
    private Double averageScore;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "personal", "contracts", "dependents", "user", "department", "position", "manager"})
    private Employee mentor;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    @PreUpdate
    public void calculateAverage() {
        int count = 0;
        double sum = 0;
        if (teamworkScore != null) { sum += teamworkScore; count++; }
        if (communicationScore != null) { sum += communicationScore; count++; }
        if (technicalScore != null) { sum += technicalScore; count++; }
        if (adaptabilityScore != null) { sum += adaptabilityScore; count++; }
        
        if (count > 0) {
            this.averageScore = sum / count;
        }
    }
}
