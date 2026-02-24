package com.project.hrm.module.evaluation.service;

import com.project.hrm.module.evaluation.dto.KpiLibraryRequest;
import com.project.hrm.module.evaluation.dto.response.KpiLibraryResponse;
import com.project.hrm.module.evaluation.entity.KpiLibrary;
import com.project.hrm.module.evaluation.repository.KpiLibraryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class KpiLibraryService {
    private final KpiLibraryRepository repository;

    public KpiLibraryService(KpiLibraryRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public KpiLibraryResponse create(KpiLibraryRequest request){
        KpiLibrary kpi = new KpiLibrary();
        kpi.setName(request.getName());
        kpi.setDescription(request.getDescription());
        kpi.setCategory(request.getCategory());
        kpi.setDefaultWeight(request.getDefaultWeight());
        
        KpiLibrary saved = repository.save(kpi);
        return mapToResponse(saved);
    }

    public List<KpiLibraryResponse> getAll(){
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
                .build();
    }
}
