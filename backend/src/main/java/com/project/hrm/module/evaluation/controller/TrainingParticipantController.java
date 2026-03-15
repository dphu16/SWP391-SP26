package com.project.hrm.module.evaluation.controller;

import com.project.hrm.module.corehr.entity.Employee;
import com.project.hrm.module.corehr.repository.EmployeeRepository;
import com.project.hrm.module.evaluation.dto.PlanTrainingRequest;
import com.project.hrm.module.evaluation.dto.TrainingParticipantRequest;
import com.project.hrm.module.evaluation.entity.TrainingParticipant;
import com.project.hrm.module.evaluation.service.TrainingParticipantService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/training-participants")
public class TrainingParticipantController {
    private final TrainingParticipantService service;
    private final EmployeeRepository employeeRepository;

    public TrainingParticipantController(TrainingParticipantService service, EmployeeRepository employeeRepository) {
        this.service = service;
        this.employeeRepository = employeeRepository;
    }

    @PostMapping
    public ResponseEntity<TrainingParticipant> create(@Valid @RequestBody TrainingParticipantRequest req){
        TrainingParticipant saved = service.create(req);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{participantId}")
                .buildAndExpand(saved.getParticipantId())
                .toUri();
        return ResponseEntity.created(location).body(saved);
    }

    @PostMapping("/plan")
    public ResponseEntity<TrainingParticipant> planTraining(@Valid @RequestBody PlanTrainingRequest req){
        return ResponseEntity.ok(service.planTraining(req));
    }

    @GetMapping
    public ResponseEntity<List<TrainingParticipant>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<TrainingParticipant>> getByEmployee(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(service.getByEmployee(employeeId));
    }

    @GetMapping("/{participantId}")
    public ResponseEntity<TrainingParticipant> getById(@PathVariable UUID participantId){
        return ResponseEntity.ok(service.getById(participantId));
    }

    @PutMapping("/{participantId}")
    public ResponseEntity<TrainingParticipant> update(@PathVariable UUID participantId, @RequestBody TrainingParticipantRequest req){
        return ResponseEntity.ok(service.update(participantId, req));
    }

    @PutMapping("/{participantId}/submit-certificate")
    public ResponseEntity<TrainingParticipant> submitCertificate(@PathVariable UUID participantId, @RequestBody java.util.Map<String, String> body){
        String certificateUrl = body.get("certificateUrl");
        if (certificateUrl == null || certificateUrl.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(service.submitCertificate(participantId, certificateUrl));
    }

    @PutMapping("/{participantId}/confirm-certificate")
    public ResponseEntity<?> confirmCertificate(@PathVariable UUID participantId) {
        try {
            // Get the current authenticated user's email from Spring Security context
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401).body(java.util.Map.of("error", "Not authenticated"));
            }
            String currentUserEmail = auth.getName();
            System.out.println(">>> Confirming for: " + currentUserEmail);

            UUID hrId = employeeRepository.findByUser_Email(currentUserEmail)
                    .or(() -> employeeRepository.findByPersonal_Email(currentUserEmail))
                    .map(Employee::getEmployeeId)
                    .orElse(null);

            if (hrId == null) {
                System.out.println(">>> HR Employee record not found. Checking for HR role as fallback...");
                boolean isHR = auth.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_HR") || a.getAuthority().equals("HR"));
                if (!isHR) {
                    return ResponseEntity.status(403).body(java.util.Map.of("error", "User " + currentUserEmail + " is not an HR employee and doesn't have HR role."));
                }
                System.out.println(">>> User has HR role, allowing confirmation without Employee record.");
            }

            return ResponseEntity.ok(service.confirmCertificate(participantId, hrId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{participantId}/reject-certificate")
    public ResponseEntity<TrainingParticipant> rejectCertificate(@PathVariable UUID participantId) {
        System.out.println(">>> Rejecting certificate for participant: " + participantId);
        return ResponseEntity.ok(service.rejectCertificate(participantId));
    }

    @DeleteMapping("/{participantId}")
    public ResponseEntity<Void> delete(@PathVariable UUID participantId){
        service.delete(participantId);
        return ResponseEntity.noContent().build();
    }
}
