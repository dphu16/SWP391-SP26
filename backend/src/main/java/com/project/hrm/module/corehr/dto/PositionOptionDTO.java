package com.project.hrm.module.corehr.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

/**
 * DTO nhẹ dùng cho dropdown chọn vị trí/chức danh ở frontend.
 * Chỉ trả về id và tên — không lộ thông tin lương hay mô tả.
 */
@Data
@AllArgsConstructor
public class PositionOptionDTO {

    private UUID id;

    private String title;
}
