package com.project.hrm.module.recruitment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.hrm.module.recruitment.dto.request.DateLimitRequest;
import com.project.hrm.module.recruitment.dto.response.ApplicationResponse;
import com.project.hrm.module.recruitment.enums.ApplicationStatus;
import com.project.hrm.module.recruitment.service.ApplicationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests for {@link ApplicationController}
 */
@WebMvcTest(controllers = ApplicationController.class)
@ContextConfiguration(classes = {ApplicationController.class, TestSecurityConfig.class})
class ApplicationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ApplicationService applicationService;

    @Autowired
    private ObjectMapper mapper;

    private UUID appId;
    private UUID jobId;
    private ApplicationResponse sampleResponse;
    private MockMultipartFile sampleCv;

    @BeforeEach
    void setup() {
        appId = UUID.randomUUID();
        jobId = UUID.randomUUID();

        sampleResponse = new ApplicationResponse();
        sampleResponse.setId(appId);
        sampleResponse.setJobId(jobId);
        sampleResponse.setStatus(ApplicationStatus.APPLIED);
        sampleResponse.setFullName("Tran Thi B");
        sampleResponse.setEmail("b@mail.com");
        sampleResponse.setPhone("0912345678");
        sampleResponse.setCvUrl("/cv/test.pdf");
        sampleResponse.setScore(null);

        sampleCv = new MockMultipartFile(
                "cvUrl",
                "test.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "dummy pdf content".getBytes()
        );
    }

    // ===================== POST /api/app =====================

    @Test
    @DisplayName("POST /api/app – HR tạo application → 201 Created")
    @WithMockUser(roles = "HR")
    void create_asHr_returns201() throws Exception {
        when(applicationService.create(any())).thenReturn(sampleResponse);

        mockMvc.perform(multipart("/api/app")
                        .file(sampleCv)
                        .param("jobId", jobId.toString())
                        .param("fullName", "Tran Thi B")
                        .param("email", "b@mail.com")
                        .param("phone", "0912345678")
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(appId.toString()))
                .andExpect(jsonPath("$.fullName").value("Tran Thi B"));
    }

    @Test
    @DisplayName("POST /api/app – MANAGER không được tạo → 403")
    @WithMockUser(roles = "MANAGER")
    void create_asManager_returns403() throws Exception {
        mockMvc.perform(multipart("/api/app")
                        .file(sampleCv)
                        .param("jobId", jobId.toString())
                        .param("fullName", "Tran Thi B")
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/app – Chưa đăng nhập → 401")
    void create_unauthenticated_returns401() throws Exception {
        mockMvc.perform(multipart("/api/app")
                        .file(sampleCv)
                        .param("jobId", jobId.toString())
                        .param("fullName", "Tran Thi B")
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isUnauthorized());
    }

    // ===================== POST /api/app/candidate =====================

    @Test
    @DisplayName("POST /api/app/candidate – Ứng viên tự nộp CV (Public) → 201 Created")
    void applyCv_public_returns201() throws Exception {
        when(applicationService.create(any())).thenReturn(sampleResponse);

        mockMvc.perform(multipart("/api/app/candidate")
                        .file(sampleCv)
                        .param("jobId", jobId.toString())
                        .param("fullName", "Tran Thi B")
                        .param("email", "b@mail.com")
                        .param("phone", "0912345678")
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(appId.toString()))
                .andExpect(jsonPath("$.fullName").value("Tran Thi B"));
    }

    // ===================== GET /api/app/{id} =====================

    @Test
    @DisplayName("GET /api/app/{id} – HR lấy chi tiết application → 200")
    @WithMockUser(roles = "HR")
    void getById_asHr_returns200() throws Exception {
        when(applicationService.getApplicationById(appId)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/app/{id}", appId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(appId.toString()))
                .andExpect(jsonPath("$.status").value("APPLIED"))
                .andExpect(jsonPath("$.email").value("b@mail.com"))
                .andExpect(jsonPath("$.fullName").value("Tran Thi B"));
    }

    @Test
    @DisplayName("GET /api/app/{id} – MANAGER lấy chi tiết application → 200")
    @WithMockUser(roles = "MANAGER")
    void getById_asManager_returns200() throws Exception {
        when(applicationService.getApplicationById(appId)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/app/{id}", appId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(appId.toString()));
    }

    @Test
    @DisplayName("GET /api/app/{id} – EMPLOYEE truy cập bị từ chối → 403")
    @WithMockUser(roles = "EMPLOYEE")
    void getById_asEmployee_returns403() throws Exception {
        mockMvc.perform(get("/api/app/{id}", appId))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/app/{id} – chưa đăng nhập → 401")
    void getById_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/app/{id}", appId))
                .andExpect(status().isUnauthorized());
    }

    // ===================== GET /api/app/job/{jobId} =====================

    @Test
    @DisplayName("GET /api/app/job/{jobId} – HR xem danh sách ứng viên → 200")
    @WithMockUser(roles = "HR")
    void getByJobId_asHr_returns200() throws Exception {
        when(applicationService.getAppByJobIdAndStatus(jobId, ApplicationStatus.APPLIED))
                .thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/app/job/{jobId}", jobId)
                        .param("status", "APPLIED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].fullName").value("Tran Thi B"));
    }

    @Test
    @DisplayName("GET /api/app/job/{jobId} – HR xem, không có ứng viên → 200, list rỗng")
    @WithMockUser(roles = "HR")
    void getByJobId_noApplications_returns200Empty() throws Exception {
        when(applicationService.getAppByJobIdAndStatus(jobId, ApplicationStatus.INTERVIEW))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/app/job/{jobId}", jobId)
                        .param("status", "INTERVIEW"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("GET /api/app/job/{jobId} – MANAGER không được xem danh sách → 403")
    @WithMockUser(roles = "MANAGER")
    void getByJobId_asManager_returns403() throws Exception {
        mockMvc.perform(get("/api/app/job/{jobId}", jobId)
                        .param("status", "APPLIED"))
                .andExpect(status().isForbidden());
    }

    // ===================== PUT /api/app/{id} =====================

    @Test
    @DisplayName("PUT /api/app/{id} – HR cập nhật application → 200")
    @WithMockUser(roles = "HR")
    void update_asHr_returns200() throws Exception {
        when(applicationService.update(eq(appId), any())).thenReturn(sampleResponse);

        mockMvc.perform(multipart("/api/app/{id}", appId)
                        .file(sampleCv)
                        .param("jobId", jobId.toString())
                        .param("fullName", "Tran Thi B Updated")
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        })
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(appId.toString()))
                .andExpect(jsonPath("$.fullName").value("Tran Thi B"));
    }

    @Test
    @DisplayName("PUT /api/app/{id} – MANAGER không được update → 403")
    @WithMockUser(roles = "MANAGER")
    void update_asManager_returns403() throws Exception {
        mockMvc.perform(multipart("/api/app/{id}", appId)
                        .file(sampleCv)
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        })
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isForbidden());
    }

    // ===================== POST /api/app/date-limit =====================

    @Test
    @DisplayName("POST /api/app/date-limit – HR đặt lịch phỏng vấn → 200, status INTERVIEW")
    @WithMockUser(roles = "HR")
    void setDateLimit_asHr_returns200() throws Exception {
        ApplicationResponse interviewResponse = buildResponseWithStatus(ApplicationStatus.INTERVIEW);
        when(applicationService.setDateLimit(any())).thenReturn(interviewResponse);

        DateLimitRequest req = new DateLimitRequest();
        req.setId(appId);
        req.setStart(OffsetDateTime.now().plusDays(1));
        req.setEnd(OffsetDateTime.now().plusDays(10));

        mockMvc.perform(post("/api/app/date-limit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INTERVIEW"));
    }

    @Test
    @DisplayName("POST /api/app/date-limit – MANAGER không được đặt lịch phỏng vấn → 403")
    @WithMockUser(roles = "MANAGER")
    void setDateLimit_asManager_returns403() throws Exception {
        mockMvc.perform(post("/api/app/date-limit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/app/date-limit – chưa đăng nhập → 401")
    void setDateLimit_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/app/date-limit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    // ===================== POST /api/app/list/next-stage =====================

    @Test
    @DisplayName("POST /api/app/list/next-stage – HR chuyển ứng viên sang OFFER → 200")
    @WithMockUser(roles = "HR")
    void nextStage_asHr_returns200() throws Exception {
        ApplicationResponse offerResponse = buildResponseWithStatus(ApplicationStatus.OFFER);
        offerResponse.setScore(BigDecimal.valueOf(8.5));
        when(applicationService.nextStage(anyList())).thenReturn(List.of(offerResponse));

        List<UUID> ids = List.of(appId);

        mockMvc.perform(post("/api/app/list/next-stage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(ids)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status").value("OFFER"))
                .andExpect(jsonPath("$[0].score").value(8.5));
    }

    @Test
    @DisplayName("POST /api/app/list/next-stage – không phải HR → 403")
    @WithMockUser(roles = "MANAGER")
    void nextStage_asManager_returns403() throws Exception {
        mockMvc.perform(post("/api/app/list/next-stage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[]"))
                .andExpect(status().isForbidden());
    }

    // ===================== PUT /api/app/last-stage/{id} =====================

    @Test
    @DisplayName("PUT /api/app/last-stage/{id} – HR hire ứng viên → 200, status HIRED")
    @WithMockUser(roles = "HR")
    void lastStage_asHr_returns200() throws Exception {
        ApplicationResponse hiredResponse = buildResponseWithStatus(ApplicationStatus.HIRED);
        when(applicationService.lastStage(appId)).thenReturn(hiredResponse);

        mockMvc.perform(put("/api/app/last-stage/{id}", appId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("HIRED"))
                .andExpect(jsonPath("$.id").value(appId.toString()));
    }

    @Test
    @DisplayName("PUT /api/app/last-stage/{id} – không phải HR → 403")
    @WithMockUser(roles = "MANAGER")
    void lastStage_asManager_returns403() throws Exception {
        mockMvc.perform(put("/api/app/last-stage/{id}", appId))
                .andExpect(status().isForbidden());
    }

    // ===================== DELETE /api/app/{id} =====================

    @Test
    @DisplayName("DELETE /api/app/{id} – HR xóa application → 204 No Content")
    @WithMockUser(roles = "HR")
    void delete_asHr_returns204() throws Exception {
        doNothing().when(applicationService).delete(appId);

        mockMvc.perform(delete("/api/app/{id}", appId))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/app/{id} – không phải HR → 403")
    @WithMockUser(roles = "MANAGER")
    void delete_asManager_returns403() throws Exception {
        mockMvc.perform(delete("/api/app/{id}", appId))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DELETE /api/app/{id} – chưa đăng nhập → 401")
    void delete_unauthenticated_returns401() throws Exception {
        mockMvc.perform(delete("/api/app/{id}", appId))
                .andExpect(status().isUnauthorized());
    }

    // ===================== Helper =====================

    private ApplicationResponse buildResponseWithStatus(ApplicationStatus status) {
        ApplicationResponse resp = new ApplicationResponse();
        resp.setId(appId);
        resp.setJobId(jobId);
        resp.setStatus(status);
        resp.setFullName("Tran Thi B");
        resp.setEmail("b@mail.com");
        resp.setPhone("0912345678");
        resp.setCvUrl("/cv/test.pdf");
        return resp;
    }
}
