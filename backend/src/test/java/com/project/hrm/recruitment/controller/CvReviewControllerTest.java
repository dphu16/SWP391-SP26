package com.project.hrm.recruitment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.hrm.module.recruitment.controller.CvReviewController;
import com.project.hrm.module.recruitment.dto.request.CvReviewRequest;
import com.project.hrm.module.recruitment.dto.response.CvReviewResponse;
import com.project.hrm.module.recruitment.enums.ResultStatus;
import com.project.hrm.module.recruitment.service.CvReviewService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests cho {@link CvReviewController}
 * Base URL: /api/cvReview
 *
 * Endpoints:
 *   POST /api/cvReview        – HR only
 *   GET  /api/cvReview/{id}   – HR only
 */
@WebMvcTest(controllers = CvReviewController.class)
@ContextConfiguration(classes = {CvReviewController.class, TestSecurityConfig.class})
class CvReviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CvReviewService cvReviewService;

    private ObjectMapper mapper;
    private UUID reviewId;
    private UUID appId;
    private CvReviewResponse sampleResponse;

    @BeforeEach
    void setup() {
        mapper = new ObjectMapper();

        reviewId = UUID.randomUUID();
        appId    = UUID.randomUUID();

        sampleResponse = new CvReviewResponse();
        sampleResponse.setId(reviewId);
        sampleResponse.setAppId(appId);
        sampleResponse.setReviewerName("Nguyen HR");
        sampleResponse.setResult(ResultStatus.PASSED);
        sampleResponse.setComment("Strong technical background");
    }

    // ===================== POST /api/cvReview =====================

    @Test
    @DisplayName("POST /api/cvReview – HR tạo review CV → 201 Created")
    @WithMockUser(roles = "HR")
    void create_asHr_returns201() throws Exception {
        when(cvReviewService.create(any())).thenReturn(sampleResponse);

        CvReviewRequest req = new CvReviewRequest();
        req.setAppId(appId);
        req.setComment("Strong technical background");
        req.setResult(ResultStatus.PASSED);

        mockMvc.perform(post("/api/cvReview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(reviewId.toString()))
                .andExpect(jsonPath("$.result").value("PASSED"))
                .andExpect(jsonPath("$.comment").value("Strong technical background"))
                .andExpect(jsonPath("$.reviewerName").value("Nguyen HR"));
    }

    @Test
    @DisplayName("POST /api/cvReview – HR tạo review với kết quả FAILED → 201")
    @WithMockUser(roles = "HR")
    void create_failedResult_returns201() throws Exception {
        CvReviewResponse failedResponse = new CvReviewResponse();
        failedResponse.setId(UUID.randomUUID());
        failedResponse.setAppId(appId);
        failedResponse.setReviewerName("Nguyen HR");
        failedResponse.setResult(ResultStatus.FAILED);
        failedResponse.setComment("Not qualified");

        when(cvReviewService.create(any())).thenReturn(failedResponse);

        CvReviewRequest req = new CvReviewRequest();
        req.setAppId(appId);
        req.setResult(ResultStatus.FAILED);
        req.setComment("Not qualified");

        mockMvc.perform(post("/api/cvReview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.result").value("FAILED"));
    }

    @Test
    @DisplayName("POST /api/cvReview – không phải HR → 403 Forbidden")
    @WithMockUser(roles = "MANAGER")
    void create_asManager_returns403() throws Exception {
        mockMvc.perform(post("/api/cvReview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/cvReview – chưa đăng nhập → 401 Unauthorized")
    void create_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/cvReview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    // ===================== GET /api/cvReview/{id} =====================

    @Test
    @DisplayName("GET /api/cvReview/{id} – HR lấy review theo appId → 200")
    @WithMockUser(roles = "HR")
    void getById_asHr_returns200() throws Exception {
        when(cvReviewService.getReviewById(appId)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/cvReview/{id}", appId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appId").value(appId.toString()))
                .andExpect(jsonPath("$.reviewerName").value("Nguyen HR"))
                .andExpect(jsonPath("$.result").value("PASSED"));
    }

    @Test
    @DisplayName("GET /api/cvReview/{id} – không phải HR → 403 Forbidden")
    @WithMockUser(roles = "MANAGER")
    void getById_asManager_returns403() throws Exception {
        mockMvc.perform(get("/api/cvReview/{id}", appId))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/cvReview/{id} – chưa đăng nhập → 401 Unauthorized")
    void getById_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/cvReview/{id}", appId))
                .andExpect(status().isUnauthorized());
    }
}
