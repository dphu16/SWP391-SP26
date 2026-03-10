package com.project.hrm.module.evaluation.repository;

import com.project.hrm.module.evaluation.entity.KpiStructureDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

@Repository
public interface KpiStructureDetailRepository extends JpaRepository<KpiStructureDetail, UUID> {
    List<KpiStructureDetail> findByStructure_StructureId(UUID structureId);

    List<KpiStructureDetail> findByStructure_DepartmentId(UUID departmentId);

    @Transactional
    @Modifying
    @Query("delete from KpiStructureDetail d where d.structure.structureId = :structureId")
    void deleteByStructure_StructureId(@Param("structureId") UUID structureId);
}
