package com.project.hrm.evaluation.service;

import com.project.hrm.evaluation.entity.KpiLibrary;
import com.project.hrm.evaluation.repository.KpiLibraryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class KpiLibraryService {
    private final KpiLibraryRepository repository;

    public KpiLibraryService(KpiLibraryRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public KpiLibrary create(KpiLibrary kpi){
        return repository.save(kpi);
    }

    public List<KpiLibrary> getAll(){
        return repository.findAll();
    }

    public KpiLibrary getById(UUID kpiId){
        return repository.findById(kpiId).orElseThrow(() -> new RuntimeException("KPI not found"));
    }

    @Transactional
    public KpiLibrary updateKpi(UUID idKpi, KpiLibrary data){
        KpiLibrary updateKpi = getById(idKpi);
        updateKpi.setName(data.getName());
        updateKpi.setCategory(data.getCategory());
        updateKpi.setDescription(data.getDescription());
        return repository.save(updateKpi);
    }

    public void delete(UUID idKpi){
        repository.deleteById(idKpi);
    }
}
