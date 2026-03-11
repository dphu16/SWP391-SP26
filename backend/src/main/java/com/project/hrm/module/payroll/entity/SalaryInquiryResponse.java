package com.project.hrm.module.payroll.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "salary_inquiry_responses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalaryInquiryResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID responseId;

    @Column(name = "inquiry_id", nullable = false, unique = true)
    private UUID inquiryId;

    @Column(name = "responder_id", nullable = false)
    private UUID responderId;

    @Column(name = "official_response", nullable = false, columnDefinition = "TEXT")
    private String officialResponse;

    @Column(name = "internal_note", columnDefinition = "TEXT")
    private String internalNote;

    @Column(name = "attachment_url")
    private String attachmentUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}
