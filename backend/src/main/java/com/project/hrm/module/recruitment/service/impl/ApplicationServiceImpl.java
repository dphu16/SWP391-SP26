package com.project.hrm.module.recruitment.service.impl;

import com.project.hrm.common.email.EmailService;
import com.project.hrm.module.recruitment.dto.request.ApplicationRequest;
import com.project.hrm.module.recruitment.dto.response.ApplicationResponse;
import com.project.hrm.module.recruitment.entity.Application;
import com.project.hrm.module.recruitment.entity.Candidate;
import com.project.hrm.module.recruitment.entity.Job;
import com.project.hrm.module.recruitment.enums.ApplicationStatus;
import com.project.hrm.module.recruitment.repository.ApplicationRepository;
import com.project.hrm.module.recruitment.repository.CandidateRepository;
import com.project.hrm.module.recruitment.repository.JobRepository;
import com.project.hrm.module.recruitment.service.ApplicationService;
import com.project.hrm.module.recruitment.service.FileService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class ApplicationServiceImpl implements ApplicationService {
    private final CandidateRepository candidateRepository;
    private final JobRepository jobRepository;
    private final EmailService emailService;
    private final ApplicationRepository applicationRepository;
    private final FileService fileService;

    @Override
    public ApplicationResponse create(ApplicationRequest request) {
        Candidate candidate = candidateRepository.findByEmail(request.getEmail())
                .orElseGet(() -> {
                    Candidate newCandidate = new Candidate();
                    newCandidate.setId(UUID.randomUUID());
                    return newCandidate;
                });
        updateCandidate(candidate,request);
        Job job = jobRepository.findById(request.getJobId())
                .orElseThrow(() -> new RuntimeException("Not found job."));

        Application app = new Application();
        if (applicationRepository.existsByCandidateIdAndJobId(
                candidate.getId(), job.getId())) {
            app = applicationRepository.findByCandidateIdAndJobId(candidate.getId(), job.getId());
        } else app.setId(UUID.randomUUID());
        app.setJob(job);
        app.setCandidate(candidate);
        String cvUrl = fileService.inputPDF(request.getCvUrl());
        app.setCvUrl(cvUrl);
        app.setStatus(ApplicationStatus.APPLIED);
        app.setCreatedAt(OffsetDateTime.now());
        applicationRepository.save(app);
        emailService.sendApplicationSuccessEmail(app);
        return mapToResponse(app);
    }

    @Override
    public ApplicationResponse getApplicationById(UUID id) {

        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        return mapToResponse(application);
    }

    @Override
    public List<ApplicationResponse> getApplicationByJobId(UUID id) {

        List<Application> applications =
                applicationRepository.findByJob_Id(id);

        return applications.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public ApplicationResponse update(UUID id, ApplicationRequest request) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found application!"));
        updateCandidate(app.getCandidate(), request);
        if (!(request.getCvUrl() == null || request.getCvUrl().isEmpty())){
            String cvUrl = fileService.inputPDF(request.getCvUrl());
            app.setCvUrl(cvUrl);
        }
        emailService.sendApplicationSuccessEmail(app);
        return mapToResponse(app);
    }

    @Override
    public void delete(UUID id) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found application!"));
        applicationRepository.delete(app);
    }

    private void updateCandidate(Candidate candidate, ApplicationRequest request) {
        candidate.setFullName(request.getFullName());
        candidate.setEmail(request.getEmail());
        candidate.setPhone(request.getPhone());
        candidate.setCreatedAt(OffsetDateTime.now());
        candidateRepository.save(candidate);
    }


    private String uploadCV(MultipartFile file) {
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

    private ApplicationResponse mapToResponse(Application entity) {
        ApplicationResponse app = new ApplicationResponse();
        app.setId(entity.getId());
        app.setJobId(entity.getJob().getId());
        app.setJobTitle(entity.getJob().getTitle());
        app.setCandidateId(entity.getCandidate().getId());
        app.setFullName(entity.getCandidate().getFullName());
        app.setEmail(entity.getCandidate().getEmail());
        app.setPhone(entity.getCandidate().getPhone());
        app.setCvUrl(entity.getCvUrl());
        app.setStatus(entity.getStatus());
        return app;
    }
}
