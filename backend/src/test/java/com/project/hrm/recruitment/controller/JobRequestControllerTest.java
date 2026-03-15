package com.project.hrm.recruitment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.project.hrm.module.recruitment.controller.JobRequestController;
import com.project.hrm.module.recruitment.dto.request.JobRequestRequest;
import com.project.hrm.module.recruitment.dto.response.JobRequestResponse;
import com.project.hrm.module.recruitment.enums.EmploymentType;
import com.project.hrm.module.recruitment.enums.RequestStatus;
import com.project.hrm.module.recruitment.service.JobRequestService;
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
 * Tests cho {@link JobRequestController}
 * Base URL: /api/job-requests
 *
 * Endpoints:
 *   POST   /api/job-requests                        – authenticated
 *   GET    /api/job-requests                        – authenticated
 *   GET    /api/job-requests/{id}                   – authenticated
 *   GET    /api/job-requests/department-name/{name} – MANAGER only
 *   GET    /api/job-requests/hr/{id}                – HR only
 *   GET    /api/job-requests/hr/null/submit         – HR only
 *   PATCH  /api/job-requests/hr/list/{id}           – HR only
 *   PUT    /api/job-requests/{id}                   – authenticated
 *   POST   /api/job-requests/{id}/status            – authenticated
 *   DELETE /api/job-requests/{id}                   – authenticated
 */
@WebMvcTest(controllers = JobRequestController.class)
@ContextConfiguration(classes = {JobRequestController.class, TestSecurityConfig.class})
class JobRequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JobRequestService jobRequestService;

    private ObjectMapper mapper;
    private UUID requestId;
    private JobRequestResponse sampleResponse;

    @BeforeEach
    void setup() {
        mapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        requestId = UUID.randomUUID();

        sampleResponse = new JobRequestResponse();
        sampleResponse.setId(requestId);
        sampleResponse.setStatus(RequestStatus.SUBMITTED);
        sampleResponse.setQuantity(3);
        sampleResponse.setLocation("Ha Noi");
        sampleResponse.setDeptName("Engineering");
        sampleResponse.setPosName("Backend Developer");
        sampleResponse.setReason("Need more staff");
        sampleResponse.setType(EmploymentType.PROBATION);
    }

    // ===================== POST /api/job-requests =====================

    @Test
    @DisplayName("POST /api/job-requests – tạo request thành công → 201")
    @WithMockUser
    void create_authenticated_returns201() throws Exception {
        when(jobRequestService.create(any())).thenReturn(sampleResponse);

        JobRequestRequest req = buildValidRequest();

        mockMvc.perform(post("/api/job-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(requestId.toString()))
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.deptName").value("Engineering"));
    }

    @Test
    @DisplayName("POST /api/job-requests – chưa đăng nhập → 401")
    void create_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/job-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    // ===================== GET /api/job-requests =====================

    @Test
    @DisplayName("GET /api/job-requests – lấy tất cả → 200")
    @WithMockUser
    void getAll_returns200() throws Exception {
        when(jobRequestService.getAllRequest()).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/job-requests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].quantity").value(3));
    }

    @Test
    @DisplayName("GET /api/job-requests – danh sách rỗng → 200")
    @WithMockUser
    void getAll_emptyList_returns200() throws Exception {
        when(jobRequestService.getAllRequest()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/job-requests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // ===================== GET /api/job-requests/{id} =====================

    @Test
    @DisplayName("GET /api/job-requests/{id} – lấy chi tiết → 200")
    @WithMockUser
    void getById_returns200() throws Exception {
        when(jobRequestService.getRequestById(requestId)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/job-requests/{id}", requestId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(requestId.toString()))
                .andExpect(jsonPath("$.location").value("Ha Noi"));
    }

    // ===================== GET /api/job-requests/department-name/{name} =====================

    @Test
    @DisplayName("GET /api/job-requests/department-name/{name} – MANAGER xem → 200")
    @WithMockUser(roles = "MANAGER")
    void getByDeptName_asManager_returns200() throws Exception {
        when(jobRequestService.getRequestByDepartmentName("Engineering", RequestStatus.SUBMITTED))
                .thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/job-requests/department-name/{name}", "Engineering")
                        .param("status", "SUBMITTED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].deptName").value("Engineering"));
    }

    @Test
    @DisplayName("GET /api/job-requests/department-name/{name} – HR không được → 403")
    @WithMockUser(roles = "HR")
    void getByDeptName_asHr_returns403() throws Exception {
        mockMvc.perform(get("/api/job-requests/department-name/{name}", "Engineering")
                        .param("status", "SUBMITTED"))
                .andExpect(status().isForbidden());
    }

    // ===================== GET /api/job-requests/hr/{id} =====================

    @Test
    @DisplayName("GET /api/job-requests/hr/{id} – HR lấy request được giao → 200")
    @WithMockUser(roles = "HR")
    void getByReportTo_asHr_returns200() throws Exception {
        UUID hrId = UUID.randomUUID();
        when(jobRequestService.getRequestByReportTo(hrId, RequestStatus.SUBMITTED))
                .thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/job-requests/hr/{id}", hrId)
                        .param("status", "SUBMITTED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @DisplayName("GET /api/job-requests/hr/{id} – không phải HR → 403")
    @WithMockUser(roles = "MANAGER")
    void getByReportTo_asManager_returns403() throws Exception {
        mockMvc.perform(get("/api/job-requests/hr/{id}", UUID.randomUUID())
                        .param("status", "SUBMITTED"))
                .andExpect(status().isForbidden());
    }

    // ===================== GET /api/job-requests/hr/null/submit =====================

    @Test
    @DisplayName("GET /api/job-requests/hr/null/submit – HR xem queue chưa được giao → 200")
    @WithMockUser(roles = "HR")
    void getByHrQueue_asHr_returns200() throws Exception {
        when(jobRequestService.getRequestByHr()).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/job-requests/hr/null/submit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    // ===================== PATCH /api/job-requests/hr/list/{id} =====================

    @Test
    @DisplayName("PATCH /api/job-requests/hr/list/{id} – HR nhận request → 200")
    @WithMockUser(roles = "HR")
    void choiceRequest_asHr_returns200() throws Exception {
        UUID hrId = UUID.randomUUID();
        List<UUID> ids = List.of(requestId);
        when(jobRequestService.choiceHr(hrId, ids)).thenReturn(List.of(sampleResponse));

        mockMvc.perform(patch("/api/job-requests/hr/list/{id}", hrId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(ids)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @DisplayName("PATCH /api/job-requests/hr/list/{id} – không phải HR → 403")
    @WithMockUser(roles = "MANAGER")
    void choiceRequest_asManager_returns403() throws Exception {
        mockMvc.perform(patch("/api/job-requests/hr/list/{id}", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[]"))
                .andExpect(status().isForbidden());
    }

    // ===================== PUT /api/job-requests/{id} =====================

    @Test
    @DisplayName("PUT /api/job-requests/{id} – cập nhật request → 200")
    @WithMockUser
    void update_returns200() throws Exception {
        when(jobRequestService.update(eq(requestId), any())).thenReturn(sampleResponse);

        mockMvc.perform(put("/api/job-requests/{id}", requestId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(buildValidRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(requestId.toString()));
    }

    // ===================== POST /api/job-requests/{id}/status =====================

    @Test
    @DisplayName("POST /api/job-requests/{id}/status – APPROVE → 200")
    @WithMockUser
    void updateStatus_approve_returns200() throws Exception {
        sampleResponse.setStatus(RequestStatus.APPROVED);
        when(jobRequestService.updateStatus(requestId, RequestStatus.APPROVED, null))
                .thenReturn(sampleResponse);

        mockMvc.perform(post("/api/job-requests/{id}/status", requestId)
                        .param("status", "APPROVED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    @DisplayName("POST /api/job-requests/{id}/status – REJECT kèm comment → 200")
    @WithMockUser
    void updateStatus_reject_withComment_returns200() throws Exception {
        sampleResponse.setStatus(RequestStatus.REJECTED);
        when(jobRequestService.updateStatus(requestId, RequestStatus.REJECTED, "Budget"))
                .thenReturn(sampleResponse);

        mockMvc.perform(post("/api/job-requests/{id}/status", requestId)
                        .param("status", "REJECTED")
                        .param("comment", "Budget"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));
    }

    // ===================== DELETE /api/job-requests/{id} =====================

    @Test
    @DisplayName("DELETE /api/job-requests/{id} – xóa thành công → 204")
    @WithMockUser
    void delete_returns204() throws Exception {
        doNothing().when(jobRequestService).delete(requestId);

        mockMvc.perform(delete("/api/job-requests/{id}", requestId))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/job-requests/{id} – chưa đăng nhập → 401")
    void delete_unauthenticated_returns401() throws Exception {
        mockMvc.perform(delete("/api/job-requests/{id}", requestId))
                .andExpect(status().isUnauthorized());
    }

    // ===================== Helper =====================

    private JobRequestRequest buildValidRequest() {
        JobRequestRequest req = new JobRequestRequest();
        req.setDeptId(UUID.randomUUID());
        req.setPosId(UUID.randomUUID());
        req.setQuantity(3);
        req.setLocation("Ha Noi");
        req.setReason("Need more staff");
        req.setType(EmploymentType.PROBATION);
        return req;
    }
}
