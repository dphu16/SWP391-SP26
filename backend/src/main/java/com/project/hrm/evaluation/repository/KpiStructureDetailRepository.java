package com.project.hrm.evaluation.repository;

import com.project.hrm.evaluation.entity.KpiStructureDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KpiStructureDetailRepository extends JpaRepository<KpiStructureDetail, UUID> {
    List<KpiStructureDetail> findByStructure_StructureId(UUID structureId);
    void deleteByStructure_StructureId(UUID structureId);
}
