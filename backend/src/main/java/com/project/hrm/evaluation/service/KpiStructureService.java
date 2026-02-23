package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.dto.request.AssignKpiRequest;
import com.project.hrm.evaluation.dto.response.KpiLibraryResponse;
import com.project.hrm.evaluation.entity.KpiLibrary;
import com.project.hrm.evaluation.entity.KpiStructure;
import com.project.hrm.evaluation.entity.KpiStructureDetail;
import com.project.hrm.evaluation.repository.KpiLibraryRepository;
import com.project.hrm.evaluation.repository.KpiStructureDetailRepository;
import com.project.hrm.evaluation.repository.KpiStructureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class KpiStructureService {

    private final KpiStructureRepository structureRepository;
    private final KpiStructureDetailRepository detailRepository;
    private final KpiLibraryRepository libraryRepository;

    public KpiStructureService(KpiStructureRepository structureRepository,
                               KpiStructureDetailRepository detailRepository,
                               KpiLibraryRepository libraryRepository) {
        this.structureRepository = structureRepository;
        this.detailRepository = detailRepository;
        this.libraryRepository = libraryRepository;
    }

    @Transactional
    public KpiStructure assignKpisToDepartment(AssignKpiRequest request) {
        KpiStructure structure = structureRepository.findByDepartmentId(request.getDepartmentId())
                .orElseGet(() -> {
                    KpiStructure newStructure = new KpiStructure();
                    newStructure.setDepartmentId(request.getDepartmentId());
                    newStructure.setStructureName(request.getStructureName() != null ? request.getStructureName() : "General KPI Structure");
                    newStructure.setCreatedAt(LocalDateTime.now());
                    return newStructure;
                });

        double totalWeight = request.getDetails() != null ?
                request.getDetails().stream().mapToDouble(AssignKpiRequest.KpiDetailDto::getWeight).sum() : 0.0;
        
        structure.setTotalWeight(totalWeight);
        KpiStructure savedStructure = structureRepository.save(structure);

        // Delete old details and replace
        if(savedStructure.getStructureId() != null) {
            detailRepository.deleteByStructure_StructureId(savedStructure.getStructureId());
        }

        if (request.getDetails() != null) {
            for (AssignKpiRequest.KpiDetailDto dto : request.getDetails()) {
                KpiLibrary library = libraryRepository.findById(dto.getKpiLibraryId())
                        .orElseThrow(() -> new RuntimeException("KPI Library not found"));

                KpiStructureDetail detail = new KpiStructureDetail();
                detail.setStructure(savedStructure);
                detail.setKpiLibrary(library);
                detail.setWeight(dto.getWeight());
                detailRepository.save(detail);
            }
        }

        return savedStructure;
    }

    public List<AssignKpiRequest.KpiDetailDto> getKpisByDepartment(UUID departmentId) {
        KpiStructure structure = structureRepository.findByDepartmentId(departmentId)
                .orElse(null);

        if (structure == null) return List.of();

        List<KpiStructureDetail> details = detailRepository.findByStructure_StructureId(structure.getStructureId());
        
        return details.stream().map(detail -> {
            AssignKpiRequest.KpiDetailDto dto = new AssignKpiRequest.KpiDetailDto();
            dto.setKpiLibraryId(detail.getKpiLibrary().getLibId());
            dto.setWeight(detail.getWeight());
            return dto;
        }).collect(Collectors.toList());
    }
}
