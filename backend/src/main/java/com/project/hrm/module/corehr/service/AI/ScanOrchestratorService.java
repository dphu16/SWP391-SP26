package com.project.hrm.module.corehr.service.AI;

import com.project.hrm.module.corehr.dto.request.ExtractedContractDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ScanOrchestratorService {

    private final GeminiService geminiService;

    public ExtractedContractDTO scan(byte[] fileBytes, String contentType) {
        GeminiService.GeminiResult geminiResult =
                geminiService.extractFromContract(fileBytes, contentType);
        return geminiResult.extractedData();
    }
}
