package com.project.hrm.module.payroll.entity;

import com.project.hrm.module.corehr.entity.Employee;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "salary_inquiry_responses")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalaryInquiryResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "response_id")
    private UUID responseId;

    /** 1-1: Mỗi inquiry chỉ có đúng 1 response chính thức */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inquiry_id", nullable = false, unique = true)
    private SalaryInquiry inquiry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responder_id", nullable = false)
    private Employee responder;

    @Column(name = "official_response", nullable = false, columnDefinition = "TEXT")
    private String officialResponse;

    /** Ghi chú nội bộ HR — không hiển thị cho nhân viên */
    @Column(name = "internal_note", columnDefinition = "TEXT")
    private String internalNote;

    @Column(name = "attachment_url")
    private String attachmentUrl;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
