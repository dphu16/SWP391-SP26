package com.project.hrm.module.recruitment.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileService {
    String inputPDF(MultipartFile file);
}
