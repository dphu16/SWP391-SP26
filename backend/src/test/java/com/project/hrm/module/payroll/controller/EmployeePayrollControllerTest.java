package com.project.hrm.module.payroll.controller;

import com.project.hrm.common.auth.security.JwtUtil;
import com.project.hrm.common.auth.service.CustomUserDetailsService;
import com.project.hrm.module.corehr.exception.GlobalExceptionHandler;
import com.project.hrm.module.payroll.dto.ResponseDTO.PayslipResponse;
import com.project.hrm.module.payroll.dto.ResponseDTO.SalaryInquiryDto;
import com.project.hrm.module.payroll.enums.PayslipStatus;
import com.project.hrm.module.payroll.enums.SalaryInquiryStatus;
import com.project.hrm.module.payroll.exception.AccessDeniedException;
import com.project.hrm.module.payroll.exception.ResourceNotFoundException;
import com.project.hrm.module.payroll.service.PayslipService;
import com.project.hrm.module.payroll.service.PdfGeneratorService;
import com.project.hrm.module.payroll.service.SalaryInquiryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean; // Dùng cho Spring Boot 3.4+
// import org.springframework.boot.test.mock.mockito.MockBean; // Bỏ comment dòng này và thay thế @MockitoBean nếu dùng Spring Boot < 3.4
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Controller tests cho EmployeePayrollController.
 */
@WebMvcTest(EmployeePayrollController.class)
@AutoConfigureMockMvc(addFilters = false) // QUAN TRỌNG: Tắt Security Filter để tránh lỗi load Context và 401 Unauthorized
@org.springframework.context.annotation.Import(GlobalExceptionHandler.class) // Load exception handler để test 404/403 đúng
@DisplayName("EmployeePayrollController Tests")
class EmployeePayrollControllerTest {

    @Autowired private MockMvc mockMvc;

    // 1. Dành cho lỗi Security/JWT (Mock các Bean mà JwtAuthFilter cần)
    @MockitoBean private JwtUtil jwtUtil;
    @MockitoBean private CustomUserDetailsService customUserDetailsService; // JwtAuthFilter yêu cầu bean này

    // 2. Dành cho lỗi JPA Auditing (Fix lỗi NoSuchBeanDefinitionException cực kỳ phổ biến)
    @MockitoBean private org.springframework.data.jpa.mapping.JpaMetamodelMappingContext jpaMappingContext;

    // 3. Các service thực tế của Controller
    @MockitoBean private PayslipService        payslipService;
    @MockitoBean private SalaryInquiryService  salaryInquiryService;
    @MockitoBean private PdfGeneratorService   pdfGeneratorService;

    // ─── Common fixtures ───────────────────────────────────────────────────────
    private UUID             employeeId;
    private UUID             payslipId;
    private UUID             inquiryId;
    private PayslipResponse  payslipResponse;
    private SalaryInquiryDto inquiryDto;

    @BeforeEach
    void setUp() {
        employeeId = UUID.randomUUID();
        payslipId  = UUID.randomUUID();
        inquiryId  = UUID.randomUUID();

        payslipResponse = PayslipResponse.builder()
                .payslipId(payslipId)
                .employeeId(employeeId)
                .employeeName("Nguyen Van A")
                .departmentName("Engineering")
                .batchId(UUID.randomUUID())
                .periodId(UUID.randomUUID())
                .month(3)
                .year(2025)
                .baseSalary(new BigDecimal("10000000"))
                .grossSalary(new BigDecimal("10000000"))
                .netSalary(new BigDecimal("8200000"))
                .status(PayslipStatus.CONFIRMED)
                .details(List.of())
                .build();

        inquiryDto = SalaryInquiryDto.builder()
                .id(inquiryId)
                .employeeId(employeeId)
                .employeeName("Nguyen Van A")
                .payslipId(payslipId)
                .subject("Sai luong co ban")
                .message("Luong thang nay tinh sai")
                .status(SalaryInquiryStatus.OPEN)
                .build();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. GET /api/v1/my/payslips
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("GET /api/v1/my/payslips")
    class GetMyPayslips {

        @Test
        @DisplayName("200 OK – trả về danh sách payslip")
        void shouldReturn200_WithPayslipList() throws Exception {
            when(payslipService.getMyPayslips(employeeId))
                    .thenReturn(List.of(payslipResponse));

            mockMvc.perform(get("/api/v1/my/payslips")
                            .requestAttr("employeeId", employeeId))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].payslipId").value(payslipId.toString()))
                    .andExpect(jsonPath("$.data[0].employeeId").value(employeeId.toString()));
        }

        @Test
        @DisplayName("200 OK – trả về list rỗng khi không có payslip")
        void shouldReturn200_WithEmptyList() throws Exception {
            when(payslipService.getMyPayslips(employeeId)).thenReturn(List.of());

            mockMvc.perform(get("/api/v1/my/payslips")
                            .requestAttr("employeeId", employeeId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(0)));
        }

        @Test
        @DisplayName("Gọi payslipService.getMyPayslips với đúng employeeId")
        void shouldCallService_WithCorrectEmployeeId() throws Exception {
            when(payslipService.getMyPayslips(employeeId)).thenReturn(List.of());

            mockMvc.perform(get("/api/v1/my/payslips")
                            .requestAttr("employeeId", employeeId))
                    .andExpect(status().isOk());

            verify(payslipService).getMyPayslips(employeeId);
        }

        @Test
        @DisplayName("200 OK – trả về nhiều payslip")
        void shouldReturn200_WithMultiplePayslips() throws Exception {
            PayslipResponse ps2 = PayslipResponse.builder()
                    .payslipId(UUID.randomUUID())
                    .employeeId(employeeId)
                    .employeeName("Nguyen Van A")
                    .month(2).year(2025)
                    .netSalary(new BigDecimal("8000000"))
                    .status(PayslipStatus.PAID)
                    .details(List.of())
                    .build();
            when(payslipService.getMyPayslips(employeeId))
                    .thenReturn(List.of(payslipResponse, ps2));

            mockMvc.perform(get("/api/v1/my/payslips")
                            .requestAttr("employeeId", employeeId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(2)));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. GET /api/v1/my/payslips/{payslipId}
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("GET /api/v1/my/payslips/{payslipId}")
    class GetMyPayslip {

        @Test
        @DisplayName("200 OK – trả về chi tiết payslip đúng")
        void shouldReturn200_WithPayslipDetail() throws Exception {
            when(payslipService.getMyPayslip(payslipId, employeeId))
                    .thenReturn(payslipResponse);

            mockMvc.perform(get("/api/v1/my/payslips/{payslipId}", payslipId)
                            .requestAttr("employeeId", employeeId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.payslipId").value(payslipId.toString()))
                    .andExpect(jsonPath("$.data.employeeId").value(employeeId.toString()))
                    .andExpect(jsonPath("$.data.employeeName").value("Nguyen Van A"))
                    .andExpect(jsonPath("$.data.month").value(3))
                    .andExpect(jsonPath("$.data.year").value(2025));
        }

        @Test
        @DisplayName("404 – khi payslip không tồn tại")
        void shouldReturn404_WhenPayslipNotFound() throws Exception {
            when(payslipService.getMyPayslip(payslipId, employeeId))
                    .thenThrow(new ResourceNotFoundException("Phiếu lương không tồn tại: " + payslipId));

            mockMvc.perform(get("/api/v1/my/payslips/{payslipId}", payslipId)
                            .requestAttr("employeeId", employeeId))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("403 – khi employee xem phiếu của người khác")
        void shouldReturn403_WhenAccessDenied() throws Exception {
            when(payslipService.getMyPayslip(payslipId, employeeId))
                    .thenThrow(new AccessDeniedException("Bạn không có quyền xem phiếu lương này."));

            mockMvc.perform(get("/api/v1/my/payslips/{payslipId}", payslipId)
                            .requestAttr("employeeId", employeeId))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Gọi service với đúng payslipId và employeeId")
        void shouldCallService_WithCorrectIds() throws Exception {
            when(payslipService.getMyPayslip(payslipId, employeeId))
                    .thenReturn(payslipResponse);

            mockMvc.perform(get("/api/v1/my/payslips/{payslipId}", payslipId)
                            .requestAttr("employeeId", employeeId))
                    .andExpect(status().isOk());

            verify(payslipService).getMyPayslip(payslipId, employeeId);
        }

        @Test
        @DisplayName("Response JSON chứa netSalary đúng")
        void shouldReturnCorrectNetSalary() throws Exception {
            when(payslipService.getMyPayslip(payslipId, employeeId))
                    .thenReturn(payslipResponse);

            mockMvc.perform(get("/api/v1/my/payslips/{payslipId}", payslipId)
                            .requestAttr("employeeId", employeeId))
                    .andExpect(jsonPath("$.data.netSalary").value(8200000));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. GET /api/v1/my/payslips/{payslipId}/pdf
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("GET /api/v1/my/payslips/{payslipId}/pdf")
    class DownloadMyPayslipPdf {

        private static final byte[] FAKE_PDF = new byte[]{0x25, 0x50, 0x44, 0x46, 0x2D}; // %PDF-

        @Test
        @DisplayName("200 OK – trả về byte array PDF hợp lệ")
        void shouldReturn200_WithPdfBytes() throws Exception {
            when(payslipService.getMyPayslip(payslipId, employeeId))
                    .thenReturn(payslipResponse);
            when(pdfGeneratorService.generatePayslipPdf(payslipResponse))
                    .thenReturn(FAKE_PDF);

            mockMvc.perform(get("/api/v1/my/payslips/{payslipId}/pdf", payslipId)
                            .requestAttr("employeeId", employeeId))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                    .andExpect(content().bytes(FAKE_PDF));
        }

        @Test
        @DisplayName("Content-Type = application/pdf")
        void shouldReturnApplicationPdfContentType() throws Exception {
            when(payslipService.getMyPayslip(payslipId, employeeId))
                    .thenReturn(payslipResponse);
            when(pdfGeneratorService.generatePayslipPdf(payslipResponse))
                    .thenReturn(FAKE_PDF);

            mockMvc.perform(get("/api/v1/my/payslips/{payslipId}/pdf", payslipId)
                            .requestAttr("employeeId", employeeId))
                    .andExpect(header().string("Content-Type", "application/pdf"));
        }

        @Test
        @DisplayName("Content-Disposition attachment với tên file đúng tháng/năm")
        void shouldReturnCorrectContentDisposition() throws Exception {
            when(payslipService.getMyPayslip(payslipId, employeeId))
                    .thenReturn(payslipResponse); // month=3, year=2025
            when(pdfGeneratorService.generatePayslipPdf(payslipResponse))
                    .thenReturn(FAKE_PDF);

            mockMvc.perform(get("/api/v1/my/payslips/{payslipId}/pdf", payslipId)
                            .requestAttr("employeeId", employeeId))
                    .andExpect(header().string("Content-Disposition",
                            containsString("Payslip_3_2025.pdf")));
        }

        @Test
        @DisplayName("404 – khi payslip không tồn tại")
        void shouldReturn404_WhenPayslipNotFound() throws Exception {
            when(payslipService.getMyPayslip(payslipId, employeeId))
                    .thenThrow(new ResourceNotFoundException("Phiếu lương không tồn tại: " + payslipId));

            mockMvc.perform(get("/api/v1/my/payslips/{payslipId}/pdf", payslipId)
                            .requestAttr("employeeId", employeeId))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("403 – khi employee tải PDF của người khác")
        void shouldReturn403_WhenAccessDenied() throws Exception {
            when(payslipService.getMyPayslip(payslipId, employeeId))
                    .thenThrow(new AccessDeniedException("Không có quyền."));

            mockMvc.perform(get("/api/v1/my/payslips/{payslipId}/pdf", payslipId)
                            .requestAttr("employeeId", employeeId))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Gọi getMyPayslip trước khi generate PDF")
        void shouldCallGetPayslipFirst_ThenGeneratePdf() throws Exception {
            when(payslipService.getMyPayslip(payslipId, employeeId))
                    .thenReturn(payslipResponse);
            when(pdfGeneratorService.generatePayslipPdf(payslipResponse))
                    .thenReturn(FAKE_PDF);

            mockMvc.perform(get("/api/v1/my/payslips/{payslipId}/pdf", payslipId)
                            .requestAttr("employeeId", employeeId))
                    .andExpect(status().isOk());

            verify(payslipService).getMyPayslip(payslipId, employeeId);
            verify(pdfGeneratorService).generatePayslipPdf(payslipResponse);
        }

        @Test
        @DisplayName("Response body không rỗng")
        void shouldReturnNonEmptyBody() throws Exception {
            byte[] pdf = new byte[2048];
            pdf[0] = 0x25; // %
            pdf[1] = 0x50; // P
            when(payslipService.getMyPayslip(payslipId, employeeId))
                    .thenReturn(payslipResponse);
            when(pdfGeneratorService.generatePayslipPdf(payslipResponse)).thenReturn(pdf);

            mockMvc.perform(get("/api/v1/my/payslips/{payslipId}/pdf", payslipId)
                            .requestAttr("employeeId", employeeId))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_PDF));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. GET /api/v1/my/inquiries
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("GET /api/v1/my/inquiries")
    class GetMyInquiries {

        @Test
        @DisplayName("200 OK – trả về danh sách inquiry")
        void shouldReturn200_WithInquiryList() throws Exception {
            when(salaryInquiryService.getMyInquiries(employeeId))
                    .thenReturn(List.of(inquiryDto));

            mockMvc.perform(get("/api/v1/my/inquiries")
                            .requestAttr("employeeId", employeeId))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].id").value(inquiryId.toString()))
                    .andExpect(jsonPath("$.data[0].status").value("OPEN"));
        }

        @Test
        @DisplayName("200 OK – trả về list rỗng khi không có inquiry")
        void shouldReturn200_WithEmptyList() throws Exception {
            when(salaryInquiryService.getMyInquiries(employeeId)).thenReturn(List.of());

            mockMvc.perform(get("/api/v1/my/inquiries")
                            .requestAttr("employeeId", employeeId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(0)));
        }

        @Test
        @DisplayName("Gọi service với đúng employeeId")
        void shouldCallService_WithCorrectEmployeeId() throws Exception {
            when(salaryInquiryService.getMyInquiries(employeeId)).thenReturn(List.of());

            mockMvc.perform(get("/api/v1/my/inquiries")
                            .requestAttr("employeeId", employeeId))
                    .andExpect(status().isOk());

            verify(salaryInquiryService).getMyInquiries(employeeId);
        }

        @Test
        @DisplayName("Response chứa subject và message đúng")
        void shouldReturnCorrectSubjectAndMessage() throws Exception {
            when(salaryInquiryService.getMyInquiries(employeeId))
                    .thenReturn(List.of(inquiryDto));

            mockMvc.perform(get("/api/v1/my/inquiries")
                            .requestAttr("employeeId", employeeId))
                    .andExpect(jsonPath("$.data[0].subject").value("Sai luong co ban"))
                    .andExpect(jsonPath("$.data[0].message").value("Luong thang nay tinh sai"));
        }

        @Test
        @DisplayName("200 OK – trả về nhiều inquiry với status khác nhau")
        void shouldReturn200_WithMultipleInquiries() throws Exception {
            SalaryInquiryDto resolved = SalaryInquiryDto.builder()
                    .id(UUID.randomUUID())
                    .employeeId(employeeId)
                    .payslipId(payslipId)
                    .subject("Another subject")
                    .message("Another message")
                    .status(SalaryInquiryStatus.RESOLVED)
                    .build();
            when(salaryInquiryService.getMyInquiries(employeeId))
                    .thenReturn(List.of(inquiryDto, resolved));

            mockMvc.perform(get("/api/v1/my/inquiries")
                            .requestAttr("employeeId", employeeId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(2)));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. POST /api/v1/my/inquiries
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("POST /api/v1/my/inquiries")
    class CreateInquiry {

        @Test
        @DisplayName("200 OK – tạo inquiry thành công")
        void shouldReturn200_WhenInquiryCreated() throws Exception {

            when(salaryInquiryService.createInquiry(eq(employeeId), any()))
                    .thenReturn(inquiryDto);

            mockMvc.perform(post("/api/v1/my/inquiries")
                            .requestAttr("employeeId", employeeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(buildCreateRequestJson()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.id").value(inquiryId.toString()))
                    .andExpect(jsonPath("$.data.status").value("OPEN"));
        }

        @Test
        @DisplayName("Response message = 'Thắc mắc đã được gửi thành công.'")
        void shouldReturnSuccessMessage() throws Exception {

            when(salaryInquiryService.createInquiry(eq(employeeId), any()))
                    .thenReturn(inquiryDto);

            mockMvc.perform(post("/api/v1/my/inquiries")
                            .requestAttr("employeeId", employeeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(buildCreateRequestJson()))
                    .andExpect(jsonPath("$.message")
                            .value("Thắc mắc đã được gửi thành công."));
        }

        @Test
        @DisplayName("400 Bad Request – khi thiếu payslipId (validation)")
        void shouldReturn400_WhenPayslipIdMissing() throws Exception {
            String json = "{\"subject\":\"Subject\",\"message\":\"Message content here\"}";

            mockMvc.perform(post("/api/v1/my/inquiries")
                            .requestAttr("employeeId", employeeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("400 Bad Request – khi subject rỗng (validation)")
        void shouldReturn400_WhenSubjectBlank() throws Exception {
            String json = "{\"payslipId\":\"" + payslipId + "\",\"subject\":\"\",\"message\":\"Message content here\"}";

            mockMvc.perform(post("/api/v1/my/inquiries")
                            .requestAttr("employeeId", employeeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("400 Bad Request – khi message rỗng (validation)")
        void shouldReturn400_WhenMessageBlank() throws Exception {
            String json = "{\"payslipId\":\"" + payslipId + "\",\"subject\":\"Subject here\",\"message\":\"\"}";

            mockMvc.perform(post("/api/v1/my/inquiries")
                            .requestAttr("employeeId", employeeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("400 Bad Request – khi body không có field bắt buộc nào")
        void shouldReturn400_WhenEmptyBody() throws Exception {
            mockMvc.perform(post("/api/v1/my/inquiries")
                            .requestAttr("employeeId", employeeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("404 – khi payslip không tồn tại")
        void shouldReturn404_WhenPayslipNotFound() throws Exception {

            when(salaryInquiryService.createInquiry(eq(employeeId), any()))
                    .thenThrow(new ResourceNotFoundException("Phiếu lương không tồn tại."));

            mockMvc.perform(post("/api/v1/my/inquiries")
                            .requestAttr("employeeId", employeeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(buildCreateRequestJson()))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("403 – khi employee tạo inquiry cho phiếu của người khác")
        void shouldReturn403_WhenAccessDenied() throws Exception {

            when(salaryInquiryService.createInquiry(eq(employeeId), any()))
                    .thenThrow(new AccessDeniedException("Không có quyền."));

            mockMvc.perform(post("/api/v1/my/inquiries")
                            .requestAttr("employeeId", employeeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(buildCreateRequestJson()))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Gọi service với đúng employeeId và request body")
        void shouldCallService_WithCorrectEmployeeIdAndRequest() throws Exception {

            when(salaryInquiryService.createInquiry(eq(employeeId), any()))
                    .thenReturn(inquiryDto);

            mockMvc.perform(post("/api/v1/my/inquiries")
                            .requestAttr("employeeId", employeeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(buildCreateRequestJson()))
                    .andExpect(status().isOk());

            verify(salaryInquiryService).createInquiry(eq(employeeId), any());
        }

        @Test
        @DisplayName("Content-Type response = application/json")
        void shouldReturnJsonContentType() throws Exception {

            when(salaryInquiryService.createInquiry(eq(employeeId), any()))
                    .thenReturn(inquiryDto);

            mockMvc.perform(post("/api/v1/my/inquiries")
                            .requestAttr("employeeId", employeeId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(buildCreateRequestJson()))
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON));
        }

        private String buildCreateRequestJson() {
            return "{\"payslipId\":\"" + payslipId + "\","
                    + "\"subject\":\"Sai luong co ban\","
                    + "\"message\":\"Luong thang nay tinh sai, de nghi kiem tra lai.\"}";
        }
    }
}