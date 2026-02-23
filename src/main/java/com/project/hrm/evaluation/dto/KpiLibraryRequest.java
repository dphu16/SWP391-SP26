package com.project.hrm.evaluation.dto;

import com.project.hrm.evaluation.entity.KpiLibrary;
import com.project.hrm.evaluation.enums.KpiCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class KpiLibraryRequest {
    @NotBlank(message = "name is required")
    private String name;

    private String description;

    @NotBlank(message = "category is required")
    private String category;

    public KpiLibrary toEntity() {
        KpiLibrary e = new KpiLibrary();
        e.setName(this.name);
        e.setDescription(this.description);
        e.setCategory(this.category);
        return e;
    }
}
