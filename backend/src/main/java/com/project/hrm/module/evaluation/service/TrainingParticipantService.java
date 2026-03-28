package com.project.hrm.module.evaluation.service;

import com.project.hrm.module.evaluation.dto.TrainingParticipantRequest;
import com.project.hrm.module.evaluation.entity.TrainingCourse;
import com.project.hrm.module.evaluation.entity.TrainingParticipant;
import com.project.hrm.module.evaluation.repository.TrainingCourseRepository;
import com.project.hrm.module.evaluation.repository.TrainingParticipantRepository;
import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.evaluation.repository.PerformanceReviewsRepository;
import com.project.hrm.module.evaluation.entity.PerformanceReviews;
import com.project.hrm.module.evaluation.dto.PlanTrainingRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class TrainingParticipantService {
    private final TrainingParticipantRepository repository;
    private final TrainingCourseRepository courseRepository;
    private final EmployeeRepository employeeRepository;
    private final PerformanceReviewsRepository reviewRepository;
    private final JdbcTemplate jdbcTemplate;

    public TrainingParticipantService(TrainingParticipantRepository repository,
                                     TrainingCourseRepository courseRepository,
                                     EmployeeRepository employeeRepository,
                                     PerformanceReviewsRepository reviewRepository,
                                     JdbcTemplate jdbcTemplate) {
        this.repository = repository;
        this.courseRepository = courseRepository;
        this.employeeRepository = employeeRepository;
        this.reviewRepository = reviewRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void dropObsoleteCheckConstraint() {
        try {
            jdbcTemplate.execute("ALTER TABLE training_participants DROP CONSTRAINT IF EXISTS training_participants_status_check;");
            System.out.println(">>> Successfully dropped obsolete DB constraint: training_participants_status_check");
        } catch (Exception e) {
            System.err.println(">>> Could not drop check constraint (might not exist): " + e.getMessage());
        }
    }

    @Transactional
    public TrainingParticipant create(TrainingParticipantRequest req){
        TrainingParticipant participant = req.toEntity();

        TrainingCourse course = courseRepository.findById(req.getCourseId())
                .orElseThrow(() -> new RuntimeException("Training course not found"));
        Employee employee = employeeRepository.findById(req.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        if (repository.existsByEmployee_EmployeeIdAndCourse_CourseUrl(req.getEmployeeId(), course.getCourseUrl())) {
            throw new RuntimeException("This employee is already assigned to a course with this URL");
        }

        participant.setCourse(course);
        participant.setEmployee(employee);

        return repository.save(participant);
    }

    @Transactional
    public TrainingParticipant planTraining(PlanTrainingRequest req) {
        // Validation 1: Deadline must be today or future
        if (req.getDeadline() != null && req.getDeadline().isBefore(LocalDate.now())) {
            throw new RuntimeException("Deadline cannot be in the past");
        }

        // Validation 2: Course URL must be unique per employee
        if (repository.existsByEmployee_EmployeeIdAndCourse_CourseUrl(req.getEmployeeId(), req.getCourseUrl())) {
            throw new RuntimeException("This employee is already assigned to a course with this URL");
        }

        Employee employee = employeeRepository.findById(req.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        PerformanceReviews review = reviewRepository.findById(req.getReviewId())
                .orElseThrow(() -> new RuntimeException("Review not found"));

        // Reuse existing course by URL if it exists, otherwise create new
        TrainingCourse savedCourse = courseRepository.findFirstByCourseUrl(req.getCourseUrl())
                .orElseGet(() -> {
                    TrainingCourse newCourse = new TrainingCourse();
                    newCourse.setCourseName(req.getCourseName());
                    newCourse.setCourseUrl(req.getCourseUrl());
                    newCourse.setPlatform(req.getPlatform());
                    return courseRepository.save(newCourse);
                });

        TrainingParticipant participant = new TrainingParticipant();
        participant.setEmployee(employee);
        participant.setCourse(savedCourse);
        participant.setStatus("REGISTERED");
        participant.setDeadline(req.getDeadline());
        participant.setReason(req.getReason());
        participant.setReview(review);

        return repository.save(participant);
    }

    public List<TrainingParticipant> getAll(){
        return repository.findAll();
    }

    public List<TrainingParticipant> getByEmployee(UUID employeeId) {
        return repository.findByEmployee_EmployeeId(employeeId);
    }

    public TrainingParticipant getById(UUID participantId){
        return repository.findById(participantId)
                .orElseThrow(() -> new RuntimeException("Training participant not found"));
    }

    @Transactional
    public TrainingParticipant update(UUID participantId, TrainingParticipantRequest req){
        TrainingParticipant existing = getById(participantId);
        if (req.getStatus() != null) existing.setStatus(req.getStatus());
        if (req.getDeadline() != null) existing.setDeadline(req.getDeadline());
        if (req.getReason() != null) existing.setReason(req.getReason());
        if (req.getCertificateUrl() != null) existing.setCertificateUrl(req.getCertificateUrl());
        if (req.getCertificateSubmittedAt() != null) existing.setCertificateSubmittedAt(req.getCertificateSubmittedAt());
        if (req.getHrConfirmedAt() != null) existing.setHrConfirmedAt(req.getHrConfirmedAt());
        return repository.save(existing);
    }

    @Transactional
    public TrainingParticipant submitCertificate(UUID participantId, String certificateUrl) {
        TrainingParticipant existing = getById(participantId);
        existing.setCertificateUrl(certificateUrl);
        existing.setCertificateSubmittedAt(OffsetDateTime.now());
        existing.setStatus("COMPLETED");
        return repository.save(existing);
    }

    @Transactional
    public TrainingParticipant confirmCertificate(UUID participantId, UUID confirmedByEmployeeId) {
        TrainingParticipant existing = getById(participantId);
        if (confirmedByEmployeeId != null) {
            Employee confirmedBy = employeeRepository.findById(confirmedByEmployeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));
            existing.setConfirmedBy(confirmedBy);
        }
        existing.setHrConfirmedAt(OffsetDateTime.now());
        existing.setStatus("CONFIRMED");
        return repository.save(existing);
    }

    @Transactional
    public TrainingParticipant rejectCertificate(UUID participantId) {
        TrainingParticipant existing = getById(participantId);
        existing.setStatus("REJECTED");
        existing.setCertificateUrl(null); 
        existing.setCertificateSubmittedAt(null);
        existing.setHrConfirmedAt(null);
        existing.setConfirmedBy(null);
        return repository.save(existing);
    }

    public void delete(UUID participantId){
        repository.deleteById(participantId);
    }
}

