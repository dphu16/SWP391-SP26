package com.project.hrm.module.recruitment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
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
 */
@WebMvcTest(controllers = JobRequestController.class)
@ContextConfiguration(classes = {JobRequestController.class, TestSecurityConfig.class})
class JobRequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JobRequestService jobRequestService;

    @Autowired
    private ObjectMapper mapper;
    
    private UUID requestId;
    private JobRequestResponse sampleResponse;

    @BeforeEach
    void setup() {
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
    // @PreAuthorize("hasAnyRole('HR', 'MANAGER')")

    @Test
    @DisplayName("POST /api/job-requests – HR tạo request → 201 Created")
    @WithMockUser(roles = "HR")
    void create_asHr_returns201() throws Exception {
        when(jobRequestService.create(any())).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/job-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(buildValidRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(requestId.toString()))
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.deptName").value("Engineering"))
                .andExpect(jsonPath("$.quantity").value(3));
    }

    @Test
    @DisplayName("POST /api/job-requests – MANAGER tạo request → 201 Created")
    @WithMockUser(roles = "MANAGER")
    void create_asManager_returns201() throws Exception {
        when(jobRequestService.create(any())).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/job-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(buildValidRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(requestId.toString()))
                .andExpect(jsonPath("$.posName").value("Backend Developer"));
    }

    @Test
    @DisplayName("POST /api/job-requests – EMPLOYEE tạo request → 403 Forbidden")
    @WithMockUser(roles = "EMPLOYEE")
    void create_asEmployee_returns403() throws Exception {
        mockMvc.perform(post("/api/job-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(buildValidRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/job-requests – chưa đăng nhập → 401 Unauthorized")
    void create_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/job-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(buildValidRequest())))
                .andExpect(status().isUnauthorized());
    }

    // ===================== GET /api/job-requests =====================
    // @PreAuthorize("hasAnyRole('HR', 'MANAGER')")

    @Test
    @DisplayName("GET /api/job-requests – HR lấy tất cả → 200 OK, trả về list")
    @WithMockUser(roles = "HR")
    void getAll_asHr_returns200() throws Exception {
        when(jobRequestService.getAllRequest()).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/job-requests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].quantity").value(3))
                .andExpect(jsonPath("$[0].location").value("Ha Noi"));
    }

    @Test
    @DisplayName("GET /api/job-requests – MANAGER lấy tất cả → 200 OK")
    @WithMockUser(roles = "MANAGER")
    void getAll_asManager_returns200() throws Exception {
        when(jobRequestService.getAllRequest()).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/job-requests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @DisplayName("GET /api/job-requests – danh sách rỗng → 200 OK, array trống")
    @WithMockUser(roles = "HR")
    void getAll_emptyList_returns200() throws Exception {
        when(jobRequestService.getAllRequest()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/job-requests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("GET /api/job-requests – HOẶC EMPLOYEE → 403 Forbidden")
    @WithMockUser(roles = "EMPLOYEE")
    void getAll_asEmployee_returns403() throws Exception {
        mockMvc.perform(get("/api/job-requests"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/job-requests – chưa đăng nhập → 401 Unauthorized")
    void getAll_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/job-requests"))
                .andExpect(status().isUnauthorized());
    }

    // ===================== GET /api/job-requests/{id} =====================
    // @PreAuthorize("hasAnyRole('HR', 'MANAGER')")

    @Test
    @DisplayName("GET /api/job-requests/{id} – HR xem chi tiết → 200 OK")
    @WithMockUser(roles = "HR")
    void getById_asHr_returns200() throws Exception {
        when(jobRequestService.getRequestById(requestId)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/job-requests/{id}", requestId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(requestId.toString()))
                .andExpect(jsonPath("$.location").value("Ha Noi"))
                .andExpect(jsonPath("$.reason").value("Need more staff"));
    }

    @Test
    @DisplayName("GET /api/job-requests/{id} – MANAGER xem chi tiết → 200 OK")
    @WithMockUser(roles = "MANAGER")
    void getById_asManager_returns200() throws Exception {
        when(jobRequestService.getRequestById(requestId)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/job-requests/{id}", requestId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(requestId.toString()))
                .andExpect(jsonPath("$.posName").value("Backend Developer"));
    }

    @Test
    @DisplayName("GET /api/job-requests/{id} – EMPLOYEE xem chi tiết → 403 Forbidden")
    @WithMockUser(roles = "EMPLOYEE")
    void getById_asEmployee_returns403() throws Exception {
        mockMvc.perform(get("/api/job-requests/{id}", requestId))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/job-requests/{id} – chưa đăng nhập → 401 Unauthorized")
    void getById_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/job-requests/{id}", requestId))
                .andExpect(status().isUnauthorized());
    }

    // ===================== GET /api/job-requests/department-name/{name} =====================
    // @PreAuthorize("hasRole('MANAGER')")

    @Test
    @DisplayName("GET /api/job-requests/department-name/{name} – MANAGER xem theo phòng ban → 200 OK")
    @WithMockUser(roles = "MANAGER")
    void getByDeptName_asManager_returns200() throws Exception {
        when(jobRequestService.getRequestByDepartmentName("Engineering", RequestStatus.SUBMITTED))
                .thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/job-requests/department-name/{name}", "Engineering")
                        .param("status", "SUBMITTED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].deptName").value("Engineering"))
                .andExpect(jsonPath("$[0].status").value("SUBMITTED"));
    }

    @Test
    @DisplayName("GET /api/job-requests/department-name/{name} – role HR → 403 Forbidden")
    @WithMockUser(roles = "HR")
    void getByDeptName_asHr_returns403() throws Exception {
        mockMvc.perform(get("/api/job-requests/department-name/{name}", "Engineering")
                        .param("status", "SUBMITTED"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/job-requests/department-name/{name} – chưa đăng nhập → 401 Unauthorized")
    void getByDeptName_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/job-requests/department-name/{name}", "Engineering")
                        .param("status", "SUBMITTED"))
                .andExpect(status().isUnauthorized());
    }

    // ===================== GET /api/job-requests/hr/{id} =====================
    // @PreAuthorize("hasRole('HR')")

    @Test
    @DisplayName("GET /api/job-requests/hr/{id} – HR lấy request được giao → 200 OK")
    @WithMockUser(roles = "HR")
    void getByReportTo_asHr_returns200() throws Exception {
        UUID hrId = UUID.randomUUID();
        when(jobRequestService.getRequestByReportTo(hrId, RequestStatus.SUBMITTED))
                .thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/job-requests/hr/{id}", hrId)
                        .param("status", "SUBMITTED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status").value("SUBMITTED"));
    }

    @Test
    @DisplayName("GET /api/job-requests/hr/{id} – role MANAGER → 403 Forbidden")
    @WithMockUser(roles = "MANAGER")
    void getByReportTo_asManager_returns403() throws Exception {
        mockMvc.perform(get("/api/job-requests/hr/{id}", UUID.randomUUID())
                        .param("status", "SUBMITTED"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/job-requests/hr/{id} – chưa đăng nhập → 401 Unauthorized")
    void getByReportTo_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/job-requests/hr/{id}", UUID.randomUUID())
                        .param("status", "SUBMITTED"))
                .andExpect(status().isUnauthorized());
    }

    // ===================== GET /api/job-requests/hr/null/submit =====================
    // @PreAuthorize("hasRole('HR')")

    @Test
    @DisplayName("GET /api/job-requests/hr/null/submit – HR xem queue chưa được giao → 200 OK")
    @WithMockUser(roles = "HR")
    void getByHrQueue_asHr_returns200() throws Exception {
        when(jobRequestService.getRequestByHr()).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/job-requests/hr/null/submit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].deptName").value("Engineering"));
    }

    @Test
    @DisplayName("GET /api/job-requests/hr/null/submit – role MANAGER → 403 Forbidden")
    @WithMockUser(roles = "MANAGER")
    void getByHrQueue_asManager_returns403() throws Exception {
        mockMvc.perform(get("/api/job-requests/hr/null/submit"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/job-requests/hr/null/submit – chưa đăng nhập → 401 Unauthorized")
    void getByHrQueue_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/job-requests/hr/null/submit"))
                .andExpect(status().isUnauthorized());
    }

    // ===================== PATCH /api/job-requests/hr/list/{id} =====================
    // @PreAuthorize("hasRole('HR')")

    @Test
    @DisplayName("PATCH /api/job-requests/hr/list/{id} – HR nhận request → 200 OK")
    @WithMockUser(roles = "HR")
    void choiceRequest_asHr_returns200() throws Exception {
        UUID hrId = UUID.randomUUID();
        List<UUID> ids = List.of(requestId);
        when(jobRequestService.choiceHr(hrId, ids)).thenReturn(List.of(sampleResponse));

        mockMvc.perform(patch("/api/job-requests/hr/list/{id}", hrId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(ids)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(requestId.toString()));
    }

    @Test
    @DisplayName("PATCH /api/job-requests/hr/list/{id} – role MANAGER → 403 Forbidden")
    @WithMockUser(roles = "MANAGER")
    void choiceRequest_asManager_returns403() throws Exception {
        mockMvc.perform(patch("/api/job-requests/hr/list/{id}", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[]"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PATCH /api/job-requests/hr/list/{id} – chưa đăng nhập → 401 Unauthorized")
    void choiceRequest_unauthenticated_returns401() throws Exception {
        mockMvc.perform(patch("/api/job-requests/hr/list/{id}", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[]"))
                .andExpect(status().isUnauthorized());
    }

    // ===================== PUT /api/job-requests/{id} =====================
    // @PreAuthorize("hasAnyRole('HR', 'MANAGER')")

    @Test
    @DisplayName("PUT /api/job-requests/{id} – MANAGER cập nhật request → 200 OK")
    @WithMockUser(roles = "MANAGER")
    void update_asManager_returns200() throws Exception {
        when(jobRequestService.update(eq(requestId), any())).thenReturn(sampleResponse);

        mockMvc.perform(put("/api/job-requests/{id}", requestId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(buildValidRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(requestId.toString()))
                .andExpect(jsonPath("$.location").value("Ha Noi"));
    }

    @Test
    @DisplayName("PUT /api/job-requests/{id} – HR cập nhật request → 200 OK")
    @WithMockUser(roles = "HR")
    void update_asHr_returns200() throws Exception {
        when(jobRequestService.update(eq(requestId), any())).thenReturn(sampleResponse);

        mockMvc.perform(put("/api/job-requests/{id}", requestId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(buildValidRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(requestId.toString()));
    }

    @Test
    @DisplayName("PUT /api/job-requests/{id} – EMPLOYEE cập nhật request → 403 Forbidden")
    @WithMockUser(roles = "EMPLOYEE")
    void update_asEmployee_returns403() throws Exception {
        mockMvc.perform(put("/api/job-requests/{id}", requestId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(buildValidRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT /api/job-requests/{id} – chưa đăng nhập → 401 Unauthorized")
    void update_unauthenticated_returns401() throws Exception {
        mockMvc.perform(put("/api/job-requests/{id}", requestId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(buildValidRequest())))
                .andExpect(status().isUnauthorized());
    }

    // ===================== POST /api/job-requests/{id}/status =====================
    // @PreAuthorize("hasAnyRole('HR', 'MANAGER')")

    @Test
    @DisplayName("POST /api/job-requests/{id}/status – HR duyệt APPROVED → 200 OK")
    @WithMockUser(roles = "HR")
    void updateStatus_asHr_approve_returns200() throws Exception {
        sampleResponse.setStatus(RequestStatus.APPROVED);
        when(jobRequestService.updateStatus(requestId, RequestStatus.APPROVED, null))
                .thenReturn(sampleResponse);

        mockMvc.perform(post("/api/job-requests/{id}/status", requestId)
                        .param("status", "APPROVED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    @DisplayName("POST /api/job-requests/{id}/status – MANAGER update status → 200 OK")
    @WithMockUser(roles = "MANAGER")
    void updateStatus_asManager_approve_returns200() throws Exception {
        sampleResponse.setStatus(RequestStatus.APPROVED);
        when(jobRequestService.updateStatus(requestId, RequestStatus.APPROVED, null))
                .thenReturn(sampleResponse);

        mockMvc.perform(post("/api/job-requests/{id}/status", requestId)
                        .param("status", "APPROVED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    @DisplayName("POST /api/job-requests/{id}/status – EMPLOYEE update status → 403")
    @WithMockUser(roles = "EMPLOYEE")
    void updateStatus_asEmployee_returns403() throws Exception {
        mockMvc.perform(post("/api/job-requests/{id}/status", requestId)
                        .param("status", "APPROVED"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/job-requests/{id}/status – HR từ chối REJECTED kèm comment → 200 OK")
    @WithMockUser(roles = "HR")
    void updateStatus_asHr_reject_withComment_returns200() throws Exception {
        sampleResponse.setStatus(RequestStatus.REJECTED);
        when(jobRequestService.updateStatus(requestId, RequestStatus.REJECTED, "Over budget"))
                .thenReturn(sampleResponse);

        mockMvc.perform(post("/api/job-requests/{id}/status", requestId)
                        .param("status", "REJECTED")
                        .param("comment", "Over budget"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));
    }

    @Test
    @DisplayName("POST /api/job-requests/{id}/status – chưa đăng nhập → 401 Unauthorized")
    void updateStatus_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/job-requests/{id}/status", requestId)
                        .param("status", "APPROVED"))
                .andExpect(status().isUnauthorized());
    }

    // ===================== DELETE /api/job-requests/{id} =====================
    // @PreAuthorize("hasAnyRole('HR', 'MANAGER')")

    @Test
    @DisplayName("DELETE /api/job-requests/{id} – MANAGER xóa thành công → 204 No Content")
    @WithMockUser(roles = "MANAGER")
    void delete_asManager_returns204() throws Exception {
        doNothing().when(jobRequestService).delete(requestId);

        mockMvc.perform(delete("/api/job-requests/{id}", requestId))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/job-requests/{id} – HR xóa thành công → 204 No Content")
    @WithMockUser(roles = "HR")
    void delete_asHr_returns204() throws Exception {
        doNothing().when(jobRequestService).delete(requestId);

        mockMvc.perform(delete("/api/job-requests/{id}", requestId))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/job-requests/{id} – EMPLOYEE xóa → 403 Forbidden")
    @WithMockUser(roles = "EMPLOYEE")
    void delete_asEmployee_returns403() throws Exception {
        mockMvc.perform(delete("/api/job-requests/{id}", requestId))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DELETE /api/job-requests/{id} – chưa đăng nhập → 401 Unauthorized")
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
