package com.project.hrm.module.recruitment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.project.hrm.module.recruitment.dto.request.CreateJobRequest;
import com.project.hrm.module.recruitment.dto.response.JobResponse;
import com.project.hrm.module.recruitment.enums.JobStatus;
import com.project.hrm.module.recruitment.service.JobService;
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

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests cho {@link JobController}
 * Base URL: /api/jobs
 *
 * Public endpoints (không cần auth):
 *   GET  /api/jobs/candidate/list-job
 *   GET  /api/jobs/candidate/list-job/{id}
 *
 * Protected endpoints (cần role HR hoặc MANAGER):
 *   POST   /api/jobs                  – HR only
 *   GET    /api/jobs                  – HR, MANAGER
 *   GET    /api/jobs/hr/{hrId}        – HR only
 *   GET    /api/jobs/{id}             – HR only
 *   PUT    /api/jobs/{id}             – HR only
 *   PATCH  /api/jobs/{id}/status      – HR only
 *   DELETE /api/jobs/{id}             – HR only
 */
@WebMvcTest(controllers = JobController.class)
@ContextConfiguration(classes = {JobController.class, TestSecurityConfig.class})
class JobControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JobService jobService;

    private ObjectMapper mapper;
    private UUID jobId;
    private JobResponse sampleResponse;

    @BeforeEach
    void setup() {
        mapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        jobId = UUID.randomUUID();

        sampleResponse = new JobResponse();
        sampleResponse.setId(jobId);
        sampleResponse.setStatus(JobStatus.OPEN);
        sampleResponse.setDeptName("Engineering");
        sampleResponse.setPosName("Backend Developer");
        sampleResponse.setQuantity(3);
        sampleResponse.setMaxCv(100);
        sampleResponse.setHrName("Nguyen Van A");
        sampleResponse.setLocation("Ha Noi");
        sampleResponse.setPostedAt(OffsetDateTime.now().minusDays(1));
        sampleResponse.setClosedTime(OffsetDateTime.now().plusDays(30));
    }

    // ===================== POST /api/jobs =====================

    @Test
    @DisplayName("POST /api/jobs – HR tạo job → 201 Created")
    @WithMockUser(roles = "HR")
    void create_asHr_returns201() throws Exception {
        when(jobService.create(any())).thenReturn(sampleResponse);

        CreateJobRequest req = buildValidCreateRequest();

        mockMvc.perform(post("/api/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(jobId.toString()))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.deptName").value("Engineering"));
    }

    @Test
    @DisplayName("POST /api/jobs – MANAGER không được tạo job → 403")
    @WithMockUser(roles = "MANAGER")
    void create_asManager_returns403() throws Exception {
        mockMvc.perform(post("/api/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/jobs – chưa đăng nhập → 401")
    void create_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    // ===================== GET /api/jobs =====================

    @Test
    @DisplayName("GET /api/jobs – HR lấy tất cả job → 200, trả list")
    @WithMockUser(roles = "HR")
    void getAll_asHr_returns200() throws Exception {
        when(jobService.getAllJob()).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/jobs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].posName").value("Backend Developer"));
    }

    @Test
    @DisplayName("GET /api/jobs – MANAGER cũng xem được → 200")
    @WithMockUser(roles = "MANAGER")
    void getAll_asManager_returns200() throws Exception {
        when(jobService.getAllJob()).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/jobs"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/jobs – không có job nào → 200, danh sách rỗng")
    @WithMockUser(roles = "HR")
    void getAll_emptyList_returns200() throws Exception {
        when(jobService.getAllJob()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/jobs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // ===================== GET /api/jobs/candidate/list-job =====================

    @Test
    @DisplayName("GET /api/jobs/candidate/list-job – endpoint public, không cần auth → 200")
    void getActiveJobs_public_returns200() throws Exception {
        when(jobService.getJobByStatus(JobStatus.OPEN)).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/jobs/candidate/list-job"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("OPEN"));
    }

    // ===================== GET /api/jobs/candidate/list-job/{id} =====================

    @Test
    @DisplayName("GET /api/jobs/candidate/list-job/{id} – public, lấy chi tiết → 200")
    void getPublicJobById_returns200() throws Exception {
        when(jobService.getJobById(jobId)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/jobs/candidate/list-job/{id}", jobId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(jobId.toString()))
                .andExpect(jsonPath("$.location").value("Ha Noi"));
    }

    // ===================== GET /api/jobs/hr/{hrId} =====================

    @Test
    @DisplayName("GET /api/jobs/hr/{hrId} – HR lấy jobs của mình → 200")
    @WithMockUser(roles = "HR")
    void getByHrId_asHr_returns200() throws Exception {
        UUID hrId = UUID.randomUUID();
        when(jobService.getJobByEmployeeId(hrId)).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/jobs/hr/{hrId}", hrId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @DisplayName("GET /api/jobs/hr/{hrId} – không phải HR → 403")
    @WithMockUser(roles = "MANAGER")
    void getByHrId_asManager_returns403() throws Exception {
        mockMvc.perform(get("/api/jobs/hr/{hrId}", UUID.randomUUID()))
                .andExpect(status().isForbidden());
    }

    // ===================== GET /api/jobs/{id} =====================

    @Test
    @DisplayName("GET /api/jobs/{id} – HR xem chi tiết job → 200")
    @WithMockUser(roles = "HR")
    void getById_asHr_returns200() throws Exception {
        when(jobService.getJobById(jobId)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/jobs/{id}", jobId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(jobId.toString()));
    }

    // ===================== PUT /api/jobs/{id} =====================

    @Test
    @DisplayName("PUT /api/jobs/{id} – HR cập nhật job → 200")
    @WithMockUser(roles = "HR")
    void update_asHr_returns200() throws Exception {
        when(jobService.update(eq(jobId), any())).thenReturn(sampleResponse);

        mockMvc.perform(put("/api/jobs/{id}", jobId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(buildValidCreateRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(jobId.toString()));
    }

    @Test
    @DisplayName("PUT /api/jobs/{id} – không phải HR → 403")
    @WithMockUser(roles = "MANAGER")
    void update_asManager_returns403() throws Exception {
        mockMvc.perform(put("/api/jobs/{id}", jobId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    // ===================== PATCH /api/jobs/{id}/status =====================

    @Test
    @DisplayName("PATCH /api/jobs/{id}/status – HR đổi status → 200")
    @WithMockUser(roles = "HR")
    void updateStatus_asHr_returns200() throws Exception {
        sampleResponse.setStatus(JobStatus.CLOSED);
        when(jobService.updateStatus(jobId, JobStatus.CLOSED)).thenReturn(sampleResponse);

        mockMvc.perform(patch("/api/jobs/{id}/status", jobId)
                        .param("status", "CLOSED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));
    }

    @Test
    @DisplayName("PATCH /api/jobs/{id}/status – không phải HR → 403")
    @WithMockUser(roles = "MANAGER")
    void updateStatus_asManager_returns403() throws Exception {
        mockMvc.perform(patch("/api/jobs/{id}/status", jobId)
                        .param("status", "CLOSED"))
                .andExpect(status().isForbidden());
    }

    // ===================== DELETE /api/jobs/{id} =====================

    @Test
    @DisplayName("DELETE /api/jobs/{id} – HR xóa job → 204 No Content")
    @WithMockUser(roles = "HR")
    void delete_asHr_returns204() throws Exception {
        doNothing().when(jobService).delete(jobId);

        mockMvc.perform(delete("/api/jobs/{id}", jobId))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/jobs/{id} – không phải HR → 403")
    @WithMockUser(roles = "MANAGER")
    void delete_asManager_returns403() throws Exception {
        mockMvc.perform(delete("/api/jobs/{id}", jobId))
                .andExpect(status().isForbidden());
    }

    // ===================== Helper =====================

    private CreateJobRequest buildValidCreateRequest() {
        CreateJobRequest req = new CreateJobRequest();
        req.setQuantity(3);
        req.setMaxCv(100);
        req.setStatus(JobStatus.OPEN);
        req.setLocation("Ha Noi");
        req.setDescription("Java developer");
        req.setResponsibility("Coding & review");
        req.setRequirement("3+ years Java");
        req.setBenefit("Insurance, bonus");
        req.setPostedTime(OffsetDateTime.now().minusDays(1));
        req.setClosedTime(OffsetDateTime.now().plusDays(30));
        req.setHrId(UUID.randomUUID());
        req.setPosId(UUID.randomUUID());
        return req;
    }
}
