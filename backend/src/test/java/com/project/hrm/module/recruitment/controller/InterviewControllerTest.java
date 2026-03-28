package com.project.hrm.module.recruitment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.project.hrm.module.recruitment.dto.request.InterviewRequest;
import com.project.hrm.module.recruitment.dto.response.InterviewResponse;
import com.project.hrm.module.recruitment.enums.InterviewStatus;
import com.project.hrm.module.recruitment.service.InterviewService;
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

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests cho {@link InterviewController}
 * Base URL: /api/interview
 *
 * Endpoints:
 *   POST  /api/interview                – HR only
 *   GET   /api/interview/{id}           – HR only
 *   PATCH /api/interview/{id}/result    – authenticated
 *   POST  /api/interview/send/{deptId}  – HR only
 *   GET   /api/interview/list/{id}      – HR, MANAGER
 *
 * InterviewStatus enum: SCHEDULED | COMPLETED | CANCELLED
 */
@WebMvcTest(controllers = InterviewController.class)
@ContextConfiguration(classes = {InterviewController.class, TestSecurityConfig.class})
class InterviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private InterviewService interviewService;

    private ObjectMapper mapper;
    private UUID interviewId;
    private UUID appId;
    private InterviewResponse sampleResponse;

    @BeforeEach
    void setup() {
        mapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        interviewId = UUID.randomUUID();
        appId       = UUID.randomUUID();

        sampleResponse = new InterviewResponse();
        sampleResponse.setId(interviewId);
        sampleResponse.setAppId(appId);
        sampleResponse.setInterviewerName("Le Interviewer");
        sampleResponse.setStatus(InterviewStatus.SCHEDULED);
        sampleResponse.setFullName("Tran Thi B");
        sampleResponse.setJobTitle("Backend Developer");
        sampleResponse.setScheduleTime(OffsetDateTime.now().plusDays(3));
    }

    // ===================== POST /api/interview =====================

    @Test
    @DisplayName("POST /api/interview – HR tạo lịch phỏng vấn → 201 Created")
    @WithMockUser(roles = "HR")
    void createSchedule_asHr_returns201() throws Exception {
        when(interviewService.createSchedule(any())).thenReturn(sampleResponse);

        InterviewRequest req = new InterviewRequest();
        req.setAppId(appId);
        req.setInterviewerId(UUID.randomUUID());
        req.setScheduleTime(OffsetDateTime.now().plusDays(3));
        req.setStatus(InterviewStatus.SCHEDULED);

        mockMvc.perform(post("/api/interview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(interviewId.toString()))
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andExpect(jsonPath("$.interviewerName").value("Le Interviewer"))
                .andExpect(jsonPath("$.fullName").value("Tran Thi B"));
    }

    @Test
    @DisplayName("POST /api/interview – không phải HR → 403 Forbidden")
    @WithMockUser(roles = "MANAGER")
    void createSchedule_asManager_returns403() throws Exception {
        mockMvc.perform(post("/api/interview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/interview – chưa đăng nhập → 401 Unauthorized")
    void createSchedule_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/interview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    // ===================== GET /api/interview/{id} =====================

    @Test
    @DisplayName("GET /api/interview/{id} – HR xem lịch phỏng vấn theo appId → 200")
    @WithMockUser(roles = "HR")
    void getById_asHr_returns200() throws Exception {
        when(interviewService.getInterviewById(appId)).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/interview/{id}", appId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].jobTitle").value("Backend Developer"))
                .andExpect(jsonPath("$[0].status").value("SCHEDULED"));
    }

    @Test
    @DisplayName("GET /api/interview/{id} – không có lịch nào → 200, list rỗng")
    @WithMockUser(roles = "HR")
    void getById_empty_returns200() throws Exception {
        when(interviewService.getInterviewById(appId)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/interview/{id}", appId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("GET /api/interview/{id} – không phải HR → 403 Forbidden")
    @WithMockUser(roles = "MANAGER")
    void getById_asManager_returns403() throws Exception {
        mockMvc.perform(get("/api/interview/{id}", appId))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/interview/{id} – chưa đăng nhập → 401")
    void getById_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/interview/{id}", appId))
                .andExpect(status().isUnauthorized());
    }

    // ===================== PATCH /api/interview/{id}/result =====================

    @Test
    @DisplayName("PATCH /api/interview/{id}/result – HR nhập kết quả COMPLETED → 201")
    @WithMockUser(roles = "HR")
    void inputResult_asHr_completed_returns201() throws Exception {
        InterviewResponse completedResponse = new InterviewResponse();
        completedResponse.setId(interviewId);
        completedResponse.setAppId(appId);
        completedResponse.setInterviewerName("Le Interviewer");
        completedResponse.setStatus(InterviewStatus.COMPLETED);
        completedResponse.setFeedback("Great candidate");
        completedResponse.setScore(BigDecimal.valueOf(8.5));
        completedResponse.setFullName("Tran Thi B");
        completedResponse.setJobTitle("Backend Developer");

        when(interviewService.inputResult(eq(interviewId), any())).thenReturn(completedResponse);

        InterviewRequest req = new InterviewRequest();
        req.setStatus(InterviewStatus.COMPLETED);
        req.setFeedback("Great candidate");
        req.setScore(BigDecimal.valueOf(8.5));

        mockMvc.perform(patch("/api/interview/{id}/result", interviewId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.score").value(8.5))
                .andExpect(jsonPath("$.feedback").value("Great candidate"));
    }

    @Test
    @DisplayName("PATCH /api/interview/{id}/result – EMPLOYEE không được nhập kết quả → 403")
    @WithMockUser(roles = "EMPLOYEE")
    void inputResult_asEmployee_returns403() throws Exception {
        mockMvc.perform(patch("/api/interview/{id}/result", interviewId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PATCH /api/interview/{id}/result – nhập kết quả COMPLETED → 201")
    @WithMockUser(roles = "MANAGER")
    void inputResult_completed_returns201() throws Exception {
        InterviewResponse completedResponse = new InterviewResponse();
        completedResponse.setId(interviewId);
        completedResponse.setAppId(appId);
        completedResponse.setInterviewerName("Le Interviewer");
        completedResponse.setStatus(InterviewStatus.COMPLETED);
        completedResponse.setFeedback("Excellent performance");
        completedResponse.setScore(BigDecimal.valueOf(9.0));
        completedResponse.setFullName("Tran Thi B");
        completedResponse.setJobTitle("Backend Developer");

        when(interviewService.inputResult(eq(interviewId), any())).thenReturn(completedResponse);

        InterviewRequest req = new InterviewRequest();
        req.setStatus(InterviewStatus.COMPLETED);
        req.setFeedback("Excellent performance");
        req.setScore(BigDecimal.valueOf(9.0));

        mockMvc.perform(patch("/api/interview/{id}/result", interviewId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.score").value(9.0))
                .andExpect(jsonPath("$.feedback").value("Excellent performance"));
    }

    @Test
    @DisplayName("PATCH /api/interview/{id}/result – nhập kết quả CANCELLED → 201")
    @WithMockUser(roles = "MANAGER")
    void inputResult_cancelled_returns201() throws Exception {
        InterviewResponse cancelledResponse = new InterviewResponse();
        cancelledResponse.setId(interviewId);
        cancelledResponse.setAppId(appId);
        cancelledResponse.setInterviewerName("Le Interviewer");
        cancelledResponse.setStatus(InterviewStatus.CANCELLED);
        cancelledResponse.setFeedback("Candidate did not show up");
        cancelledResponse.setFullName("Tran Thi B");
        cancelledResponse.setJobTitle("Backend Developer");

        when(interviewService.inputResult(eq(interviewId), any())).thenReturn(cancelledResponse);

        InterviewRequest req = new InterviewRequest();
        req.setStatus(InterviewStatus.CANCELLED);
        req.setFeedback("Candidate did not show up");

        mockMvc.perform(patch("/api/interview/{id}/result", interviewId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    @DisplayName("PATCH /api/interview/{id}/result – chưa đăng nhập → 401")
    void inputResult_unauthenticated_returns401() throws Exception {
        mockMvc.perform(patch("/api/interview/{id}/result", interviewId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    // ===================== POST /api/interview/send/{deptId} =====================

    @Test
    @DisplayName("POST /api/interview/send/{deptId} – HR gửi danh sách phỏng vấn → 200")
    @WithMockUser(roles = "HR")
    void sendList_asHr_returns200() throws Exception {
        UUID deptId = UUID.randomUUID();
        List<UUID> ids = List.of(interviewId);
        when(interviewService.sendInterviewList(ids, deptId)).thenReturn(List.of(sampleResponse));

        mockMvc.perform(post("/api/interview/send/{deptId}", deptId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(ids)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].interviewerName").value("Le Interviewer"));
    }

    @Test
    @DisplayName("POST /api/interview/send/{deptId} – không phải HR → 403")
    @WithMockUser(roles = "MANAGER")
    void sendList_asManager_returns403() throws Exception {
        mockMvc.perform(post("/api/interview/send/{deptId}", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[]"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/interview/send/{deptId} – chưa đăng nhập → 401")
    void sendList_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/interview/send/{deptId}", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[]"))
                .andExpect(status().isUnauthorized());
    }

    // ===================== GET /api/interview/list/{id} =====================

    @Test
    @DisplayName("GET /api/interview/list/{id} – HR xem danh sách phỏng vấn → 200")
    @WithMockUser(roles = "HR")
    void getList_asHr_returns200() throws Exception {
        UUID interviewerId = UUID.randomUUID();
        when(interviewService.getInterviewList(interviewerId)).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/interview/list/{id}", interviewerId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].jobTitle").value("Backend Developer"));
    }

    @Test
    @DisplayName("GET /api/interview/list/{id} – MANAGER cũng xem được → 200")
    @WithMockUser(roles = "MANAGER")
    void getList_asManager_returns200() throws Exception {
        UUID interviewerId = UUID.randomUUID();
        when(interviewService.getInterviewList(interviewerId)).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/interview/list/{id}", interviewerId))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/interview/list/{id} – EMPLOYEE không có quyền → 403")
    @WithMockUser(roles = "EMPLOYEE")
    void getList_asEmployee_returns403() throws Exception {
        mockMvc.perform(get("/api/interview/list/{id}", UUID.randomUUID()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/interview/list/{id} – chưa đăng nhập → 401")
    void getList_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/interview/list/{id}", UUID.randomUUID()))
                .andExpect(status().isUnauthorized());
    }
}
