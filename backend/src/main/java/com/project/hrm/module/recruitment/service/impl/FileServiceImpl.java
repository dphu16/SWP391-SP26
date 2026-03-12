package com.project.hrm.module.recruitment.service.impl;

import com.project.hrm.module.recruitment.service.FileService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileServiceImpl implements FileService {

    @Override
    public String inputPDF(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("CV file is required");
        }

        String originalFileName = getOriginalFileName(file);

        validatePdf(originalFileName, file);

        String fileName = processAndSaveFile(file, originalFileName);

        return "/cv/" + fileName;
    }

    private String getOriginalFileName(MultipartFile file) {
        String originalFileName = file.getOriginalFilename();

        if (originalFileName == null || originalFileName.isEmpty()) {
            throw new RuntimeException("CV file is required");
        }

        return originalFileName;
    }

    private void validatePdf(String originalFileName, MultipartFile file) {

        if (!originalFileName.toLowerCase().endsWith(".pdf")) {
            throw new RuntimeException("Only PDF files are allowed");
        }

        if (!"application/pdf".equals(file.getContentType())) {
            throw new RuntimeException("Invalid file type. Only PDF allowed");
        }
    }

    private String processAndSaveFile(MultipartFile file, String originalFileName) {

        try {

            // lấy extension
            String extension = originalFileName.substring(originalFileName.lastIndexOf("."));

            // tạo tên file mới
            String fileName = UUID.randomUUID() + extension;

            // tạo thư mục nếu chưa tồn tại
            Path uploadDir = Paths.get("uploads/cv/");

            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            // lưu file
            Path filePath = uploadDir.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            return fileName;

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload CV", e);
        }
    }
}
