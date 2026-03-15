package com.project.hrm.module.corehr.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "contract_documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Quan hệ 1-1 với Contract.
     * Mỗi hợp đồng có đúng 1 file PDF gốc được scan.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false, unique = true)
    private Contract contract;

    /**
     * Giữ thêm employeeId để lookup nhanh mà không cần join qua Contract.
     * Luôn đồng bộ với contract.employee.id.
     */
    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    /**
     * Đường dẫn tương đối trên server.
     * VD: "2025/04/HDLD-2025-0042_a1b2c3d4.pdf"
     */
    @Column(name = "file_path", nullable = false)
    private String filePath;

    /** MIME type — luôn là "application/pdf" trong flow này */
    @Column(name = "file_type", nullable = false)
    private String fileType;



    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
