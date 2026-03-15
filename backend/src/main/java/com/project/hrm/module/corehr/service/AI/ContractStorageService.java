package com.project.hrm.module.corehr.service.AI;

import com.project.hrm.module.corehr.entity.Contract;
import com.project.hrm.module.corehr.entity.ContractDocument;
import com.project.hrm.module.corehr.repository.ContractDocumentRepository;
import com.project.hrm.module.corehr.repository.ContractRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContractStorageService {

    private final ContractDocumentRepository contractDocumentRepository;
    private final ContractRepository contractRepository;

    @Value("${app.contract.storage-path:./storage/contracts}")
    private String storagePath;

    /**
     * Lưu file PDF lên filesystem và tạo ContractDocument liên kết với Contract.
     * Gọi sau khi HR confirm — lúc này Contract đã có trong DB.
     *
     * @param contractId     UUID của Contract vừa tạo (lấy từ NewHireResponseDTO.contractId)
     * @param fileBase64     File PDF encode base64 (FE gửi kèm)
     */
    public ContractDocument saveContract(
            UUID contractId,
            String fileBase64) throws IOException {

        // Load Contract từ DB
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy hợp đồng với id: " + contractId));

        byte[] pdfBytes = Base64.getDecoder().decode(fileBase64);

        // Tạo thư mục theo năm/tháng: storage/2025/04/
        LocalDate today = LocalDate.now();
        Path dir = Paths.get(storagePath,
                String.valueOf(today.getYear()),
                String.format("%02d", today.getMonthValue()));
        Files.createDirectories(dir);

        // Tên file = contractNumber + random suffix để tránh trùng
        String safeName = sanitizeFileName(contract.getContractNumber());
        String fileName = safeName + "_" + UUID.randomUUID().toString().substring(0, 8) + ".pdf";
        Path filePath = dir.resolve(fileName);

        Files.write(filePath, pdfBytes);
        log.info("Saved contract file: {}", filePath);

        ContractDocument doc = ContractDocument.builder()
                .contract(contract)
                .employeeId(contract.getEmployee().getEmployeeId())
                .filePath(toRelativePath(filePath))
                .fileType("application/pdf")
                .build();

        return contractDocumentRepository.save(doc);
    }

    /**
     * Load PDF bytes theo employeeId
     */
    public byte[] loadPdfBytes(UUID employeeId) throws IOException {
        ContractDocument doc = contractDocumentRepository
                .findTopByEmployeeIdOrderByCreatedAtDesc(employeeId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy hợp đồng cho nhân viên: " + employeeId));

        return Files.readAllBytes(Paths.get(storagePath).resolve(doc.getFilePath()));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private String sanitizeFileName(String contractNumber) {
        if (contractNumber == null || contractNumber.isBlank()) return "contract";
        return contractNumber.replaceAll("[^a-zA-Z0-9\\-_]", "_");
    }

    private String toRelativePath(Path absolutePath) {
        return Paths.get(storagePath).relativize(absolutePath).toString();
    }
}
