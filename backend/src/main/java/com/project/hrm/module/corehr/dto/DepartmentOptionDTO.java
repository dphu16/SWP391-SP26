package com.project.hrm.module.corehr.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

/**
 * DTO nhẹ dùng cho dropdown chọn phòng ban ở frontend.
 * Chỉ trả về id và tên — không lộ thông tin nhạy cảm.
 */
@Data
@AllArgsConstructor
public class DepartmentOptionDTO {

    private UUID id;

    private String name;
}
