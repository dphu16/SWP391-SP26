package com.project.hrm.module.evaluation.service;

import com.project.hrm.module.corehr.entity.Department;
import com.project.hrm.module.corehr.repository.DepartmentRepository;
import com.project.hrm.module.evaluation.dto.KpiLibraryRequest;
import com.project.hrm.module.evaluation.dto.response.KpiLibraryResponse;
import com.project.hrm.module.evaluation.entity.KpiLibrary;
import com.project.hrm.module.evaluation.entity.KpiStructure;
import com.project.hrm.module.evaluation.entity.KpiStructureDetail;
import com.project.hrm.module.evaluation.repository.KpiLibraryRepository;
import com.project.hrm.module.evaluation.repository.KpiStructureDetailRepository;
import com.project.hrm.module.evaluation.repository.KpiStructureRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KpiLibraryService {
    private final KpiLibraryRepository repository;
    private final KpiStructureRepository structureRepository;
    private final KpiStructureDetailRepository detailRepository;
    private final DepartmentRepository departmentRepository;
    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void cleanupInvalidCategories() {
        try {
            // Update old categories to new ones to prevent startup crash
            jdbcTemplate.update("UPDATE kpi_libraries SET category = 'PROCESS' WHERE category IN ('EVALUATION', 'OPERATIONAL', 'BEHAVIORAL')");
            jdbcTemplate.update("UPDATE kpi_libraries SET category = 'PROCESS' WHERE category = 'PROCESs'");
            jdbcTemplate.update("UPDATE kpi_libraries SET category = UPPER(category)");
        } catch (Exception e) {
            System.err.println("Failed to clean up kpi categories: " + e.getMessage());
        }
    }

    @Transactional
    public KpiLibraryResponse create(KpiLibraryRequest request){
        KpiLibrary kpi = new KpiLibrary();
        kpi.setName(request.getName());
        kpi.setDescription(request.getDescription());
        kpi.setCategory(request.getCategory());
        kpi.setDefaultWeight(request.getDefaultWeight() != null ? request.getDefaultWeight() : 0.0);
        kpi.setMeasurementType(request.getMeasurementType() != null
                ? request.getMeasurementType()
                : com.project.hrm.module.evaluation.enums.MeasurementType.NUMERIC);
        
        KpiLibrary saved = repository.save(kpi);

        // Auto-assign to department structure if provided
        if (request.getDepartmentId() != null) {
            KpiStructure structure = structureRepository.findByDepartmentId(request.getDepartmentId())
                    .orElseGet(() -> {
                        KpiStructure newStructure = new KpiStructure();
                        newStructure.setDepartmentId(request.getDepartmentId());
                        newStructure.setTotalWeight(0.0);
                        newStructure.setCreatedAt(LocalDateTime.now());
                        
                        // Fetch department name for structureName
                        String deptName = departmentRepository.findById(request.getDepartmentId())
                            .map(Department::getDeptName)
                            .orElse("Unknown Department");
                        newStructure.setStructureName("KPI Structure - " + deptName);
                        
                        return structureRepository.save(newStructure);
                    });

            KpiStructureDetail detail = new KpiStructureDetail();
            detail.setStructure(structure);
            detail.setKpiLibrary(saved);
            detail.setWeight(saved.getDefaultWeight()); // Initially use default weight
            detailRepository.save(detail);

            // Re-calculate total weight
            updateStructureTotalWeight(structure);
        }

        return mapToResponse(saved);
    }

    private void updateStructureTotalWeight(KpiStructure structure) {
        List<KpiStructureDetail> details = detailRepository.findByStructure_StructureId(structure.getStructureId());
        double total = details.stream().mapToDouble(KpiStructureDetail::getWeight).sum();
        structure.setTotalWeight(total);
        structureRepository.save(structure);
    }

    public List<KpiLibraryResponse> getAll(UUID departmentId){
        if (departmentId != null) {
            // Find KPIs associated with this department's structure
            List<KpiStructureDetail> details = detailRepository.findByStructure_DepartmentId(departmentId);
            return details.stream()
                    .map(detail -> mapToResponse(detail.getKpiLibrary()))
                    .collect(Collectors.toList());
        }
        return repository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public KpiLibraryResponse getById(UUID kpiId){
        KpiLibrary kpi = repository.findById(kpiId)
                .orElseThrow(() -> new RuntimeException("KPI not found"));
        return mapToResponse(kpi);
    }

    @Transactional
    public KpiLibraryResponse updateKpi(UUID idKpi, KpiLibraryRequest request){
        KpiLibrary updateKpi = repository.findById(idKpi)
                .orElseThrow(() -> new RuntimeException("KPI not found"));
        updateKpi.setName(request.getName());
        updateKpi.setCategory(request.getCategory());
        updateKpi.setDescription(request.getDescription());
        updateKpi.setDefaultWeight(request.getDefaultWeight());
        if (request.getMeasurementType() != null) {
            updateKpi.setMeasurementType(request.getMeasurementType());
        }
        
        KpiLibrary saved = repository.save(updateKpi);
        return mapToResponse(saved);
    }

    public void delete(UUID idKpi){
        repository.deleteById(idKpi);
    }

    private KpiLibraryResponse mapToResponse(KpiLibrary entity) {
        return KpiLibraryResponse.builder()
                .libId(entity.getLibId())
                .name(entity.getName())
                .description(entity.getDescription())
                .category(entity.getCategory())
                .defaultWeight(entity.getDefaultWeight())
                .measurementType(entity.getMeasurementType())
                .build();
    }
}
