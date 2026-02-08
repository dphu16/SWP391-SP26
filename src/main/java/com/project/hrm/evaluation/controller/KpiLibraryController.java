package com.project.hrm.evaluation.controller;

import com.project.hrm.evaluation.entity.KpiLibrary;
import com.project.hrm.evaluation.service.KpiLibraryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/kpi_libraries")
public class KpiLibraryController {
    private final KpiLibraryService service;

    public KpiLibraryController(KpiLibraryService service) {
        this.service = service;
    }

    @PostMapping
    public KpiLibrary createKpiLibrary(@RequestBody KpiLibrary kpiLibrary){
        return service.create(kpiLibrary);
    };

    @GetMapping
    public List<KpiLibrary> getAll(){
        return service.getAll();
    }

    @GetMapping("/{idKpi}")
    public KpiLibrary getById(@PathVariable UUID idKpi){
        return service.getById(idKpi);
    }

    @PutMapping("/{idKpi}")
    public KpiLibrary updateById(@PathVariable UUID idKpi, @RequestBody KpiLibrary kpiLibrary){
        return service.updateKpi(idKpi, kpiLibrary);
    }


    @DeleteMapping("/{idKpi}")
    public void delete(@PathVariable UUID idKpi){
        service.delete(idKpi);
    }

}
