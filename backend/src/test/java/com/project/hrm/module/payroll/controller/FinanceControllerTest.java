package com.project.hrm.module.payroll.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.hrm.common.auth.security.JwtUtil;
import com.project.hrm.common.auth.service.CustomUserDetailsService;
import com.project.hrm.module.corehr.exception.GlobalExceptionHandler;
import com.project.hrm.module.payroll.dto.RequestDTO.ReviewPaymentRequestRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.PaymentRequestResponse;
import com.project.hrm.module.payroll.dto.ResponseDTO.PayslipResponse;
import com.project.hrm.module.payroll.dto.ResponseDTO.TaxReportResponse;
import com.project.hrm.module.payroll.entity.FinanceAccount;
import com.project.hrm.module.payroll.enums.PaymentRequestStatus;
import com.project.hrm.module.payroll.enums.PaymentRequestType;
import com.project.hrm.module.payroll.enums.PayslipStatus;
import com.project.hrm.module.payroll.exception.ResourceNotFoundException;
import com.project.hrm.module.payroll.repository.FinanceAccountRepository;
import com.project.hrm.module.payroll.service.PaymentRequestService;
import com.project.hrm.module.payroll.service.PayslipService;
import com.project.hrm.module.payroll.service.PdfGeneratorService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
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

@WebMvcTest(FinanceController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("FinanceController Tests")
class FinanceControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private JwtUtil jwtUtil;
    @MockitoBean private CustomUserDetailsService customUserDetailsService;
    @MockitoBean private org.springframework.data.jpa.mapping.JpaMetamodelMappingContext jpaMappingContext;

    @MockitoBean private PaymentRequestService paymentRequestService;
    @MockitoBean private PayslipService payslipService;
    @MockitoBean private FinanceAccountRepository financeAccountRepository;
    @MockitoBean private PdfGeneratorService pdfGeneratorService;

    private UUID requestId;
    private UUID batchId;
    private UUID approverId;
    private PaymentRequestResponse pendingRequest;
    private PaymentRequestResponse approvedRequest;
    private PaymentRequestResponse rejectedRequest;
    private PayslipResponse payslipResponse;
    private TaxReportResponse taxReportResponse;
    private FinanceAccount financeAccount;

    @BeforeEach
    void setUp() {
        requestId  = UUID.randomUUID();
        batchId    = UUID.randomUUID();
        approverId = UUID.randomUUID();

        // Note: PaymentRequestResponse uses 'requestId' and 'totalAmountRequested'
        pendingRequest = PaymentRequestResponse.builder()
                .requestId(requestId).payrollBatchId(batchId)
                .requesterId(UUID.randomUUID()).type(PaymentRequestType.SALARY)
                .status(PaymentRequestStatus.PENDING)
                .totalAmountRequested(new BigDecimal("500000000")).build();

        approvedRequest = PaymentRequestResponse.builder()
                .requestId(requestId).payrollBatchId(batchId)
                .type(PaymentRequestType.SALARY).status(PaymentRequestStatus.APPROVED)
                .totalAmountRequested(new BigDecimal("500000000"))
                .financeNote("Đã duyệt.").build();

        rejectedRequest = PaymentRequestResponse.builder()
                .requestId(requestId).status(PaymentRequestStatus.REJECTED).build();

        payslipResponse = PayslipResponse.builder()
                .payslipId(UUID.randomUUID()).employeeId(UUID.randomUUID())
                .employeeName("Nguyen Van A").month(3).year(2025)
                .netSalary(new BigDecimal("10000000"))
                .status(PayslipStatus.CONFIRMED).details(List.of()).build();

        // TaxReportResponse uses 'taxAmount' (Double), not 'personalIncomeTax'
        taxReportResponse = TaxReportResponse.builder()
                .employeeId(UUID.randomUUID()).employeeName("Nguyen Van A")
                .month(3).year(2025).taxAmount(500000.0).build();

        // FinanceAccount uses @Builder and 'accountId' (not 'id')
        financeAccount = FinanceAccount.builder()
                .accountId(UUID.randomUUID()).accountName("Vietcombank HCM")
                .accountNumber("1234567890").status("ACTIVE").build();
    }

    // ─── GET /payment-requests/pending ─────────────────────────────────────────
    @Nested @DisplayName("GET /payment-requests/pending")
    class GetPendingRequests {

        @Test @DisplayName("200 – trả về list pending")
        void shouldReturn200WithPendingList() throws Exception {
            when(paymentRequestService.getPendingRequests()).thenReturn(List.of(pendingRequest));
            mockMvc.perform(get("/api/v1/finance/payroll/payment-requests/pending"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].requestId").value(requestId.toString()))
                    .andExpect(jsonPath("$.data[0].status").value("PENDING"));
        }

        @Test @DisplayName("200 – list rỗng")
        void shouldReturn200WithEmptyList() throws Exception {
            when(paymentRequestService.getPendingRequests()).thenReturn(List.of());
            mockMvc.perform(get("/api/v1/finance/payroll/payment-requests/pending"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(0)));
        }

        @Test @DisplayName("Gọi service")
        void shouldCallService() throws Exception {
            when(paymentRequestService.getPendingRequests()).thenReturn(List.of());
            mockMvc.perform(get("/api/v1/finance/payroll/payment-requests/pending"))
                    .andExpect(status().isOk());
            verify(paymentRequestService).getPendingRequests();
        }
    }

    // ─── GET /payment-requests ──────────────────────────────────────────────────
    @Nested @DisplayName("GET /payment-requests")
    class GetAllRequests {

        @Test @DisplayName("200 – trả về requests")
        void shouldReturn200() throws Exception {
            when(paymentRequestService.getPendingRequests()).thenReturn(List.of(pendingRequest));
            mockMvc.perform(get("/api/v1/finance/payroll/payment-requests"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(1)));
        }

        @Test @DisplayName("200 – list rỗng")
        void shouldReturn200WithEmpty() throws Exception {
            when(paymentRequestService.getPendingRequests()).thenReturn(List.of());
            mockMvc.perform(get("/api/v1/finance/payroll/payment-requests"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(0)));
        }
    }

    // ─── PUT /payment-requests/{id}/review ─────────────────────────────────────
    @Nested @DisplayName("PUT /payment-requests/{id}/review")
    class ReviewRequest {

        @Test @DisplayName("200 – approve, message chứa 'duyệt'")
        void shouldApprove() throws Exception {
            ReviewPaymentRequestRequest body = new ReviewPaymentRequestRequest();
            body.setApproved(true); body.setFinanceNote("OK");
            when(paymentRequestService.reviewRequest(eq(approverId), eq(requestId), any()))
                    .thenReturn(approvedRequest);
            mockMvc.perform(put("/api/v1/finance/payroll/payment-requests/{id}/review", requestId)
                            .requestAttr("employeeId", approverId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value(containsString("duyệt")))
                    .andExpect(jsonPath("$.data.status").value("APPROVED"));
        }

        @Test @DisplayName("200 – reject, message chứa 'từ chối'")
        void shouldReject() throws Exception {
            ReviewPaymentRequestRequest body = new ReviewPaymentRequestRequest();
            body.setApproved(false); body.setFinanceNote("Không hợp lệ");
            when(paymentRequestService.reviewRequest(eq(approverId), eq(requestId), any()))
                    .thenReturn(rejectedRequest);
            mockMvc.perform(put("/api/v1/finance/payroll/payment-requests/{id}/review", requestId)
                            .requestAttr("employeeId", approverId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value(containsString("từ chối")));
        }

        @Test @DisplayName("404 – request không tồn tại")
        void shouldReturn404() throws Exception {
            ReviewPaymentRequestRequest body = new ReviewPaymentRequestRequest();
            body.setApproved(true); body.setFinanceNote("OK");
            when(paymentRequestService.reviewRequest(any(), eq(requestId), any()))
                    .thenThrow(new ResourceNotFoundException("Request không tồn tại."));
            mockMvc.perform(put("/api/v1/finance/payroll/payment-requests/{id}/review", requestId)
                            .requestAttr("employeeId", approverId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isNotFound());
        }
    }

    // ─── GET /batches/{batchId}/tax-report ─────────────────────────────────────
    @Nested @DisplayName("GET /batches/{batchId}/tax-report")
    class GetTaxReport {

        @Test @DisplayName("200 – trả về tax report")
        void shouldReturn200() throws Exception {
            when(payslipService.getTaxReportByBatch(batchId)).thenReturn(List.of(taxReportResponse));
            mockMvc.perform(get("/api/v1/finance/payroll/batches/{id}/tax-report", batchId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].employeeName").value("Nguyen Van A"));
        }

        @Test @DisplayName("200 – list rỗng")
        void shouldReturn200Empty() throws Exception {
            when(payslipService.getTaxReportByBatch(batchId)).thenReturn(List.of());
            mockMvc.perform(get("/api/v1/finance/payroll/batches/{id}/tax-report", batchId))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(0)));
        }

        @Test @DisplayName("404 – batch không tồn tại")
        void shouldReturn404() throws Exception {
            when(payslipService.getTaxReportByBatch(batchId))
                    .thenThrow(new ResourceNotFoundException("Batch không tồn tại."));
            mockMvc.perform(get("/api/v1/finance/payroll/batches/{id}/tax-report", batchId))
                    .andExpect(status().isNotFound());
        }
    }

    // ─── GET /payment-requests/{id}/download ───────────────────────────────────
    @Nested @DisplayName("GET /payment-requests/{id}/download")
    class DownloadPaymentReport {

        private static final byte[] FAKE_PDF = {0x25, 0x50, 0x44, 0x46, 0x2D};

        @Test @DisplayName("200 – trả về PDF bytes")
        void shouldReturnPdf() throws Exception {
            when(paymentRequestService.getRequestById(requestId)).thenReturn(pendingRequest);
            when(payslipService.getPayslipsByBatch(batchId)).thenReturn(List.of(payslipResponse));
            when(pdfGeneratorService.generateBankTransferPdf(any(), any())).thenReturn(FAKE_PDF);
            mockMvc.perform(get("/api/v1/finance/payroll/payment-requests/{id}/download", requestId))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_PDF));
        }

        @Test @DisplayName("Content-Disposition chứa tên file")
        void shouldReturnFilename() throws Exception {
            when(paymentRequestService.getRequestById(requestId)).thenReturn(pendingRequest);
            when(payslipService.getPayslipsByBatch(batchId)).thenReturn(List.of(payslipResponse));
            when(pdfGeneratorService.generateBankTransferPdf(any(), any())).thenReturn(FAKE_PDF);
            mockMvc.perform(get("/api/v1/finance/payroll/payment-requests/{id}/download", requestId))
                    .andExpect(header().string("Content-Disposition", containsString("Salary_Payment_Report_")));
        }

        @Test @DisplayName("404 – request không tồn tại")
        void shouldReturn404() throws Exception {
            when(paymentRequestService.getRequestById(requestId))
                    .thenThrow(new ResourceNotFoundException("Request không tồn tại."));
            mockMvc.perform(get("/api/v1/finance/payroll/payment-requests/{id}/download", requestId))
                    .andExpect(status().isNotFound());
        }
    }

    // ─── GET /batches/{batchId}/payslips ───────────────────────────────────────
    @Nested @DisplayName("GET /batches/{batchId}/payslips")
    class GetPayslipsByBatch {

        @Test @DisplayName("200 – trả về payslips")
        void shouldReturn200() throws Exception {
            when(payslipService.getPayslipsByBatch(batchId)).thenReturn(List.of(payslipResponse));
            mockMvc.perform(get("/api/v1/finance/payroll/batches/{id}/payslips", batchId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].employeeName").value("Nguyen Van A"));
        }

        @Test @DisplayName("200 – list rỗng")
        void shouldReturn200Empty() throws Exception {
            when(payslipService.getPayslipsByBatch(batchId)).thenReturn(List.of());
            mockMvc.perform(get("/api/v1/finance/payroll/batches/{id}/payslips", batchId))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(0)));
        }

        @Test @DisplayName("Gọi service với đúng batchId")
        void shouldCallService() throws Exception {
            when(payslipService.getPayslipsByBatch(batchId)).thenReturn(List.of());
            mockMvc.perform(get("/api/v1/finance/payroll/batches/{id}/payslips", batchId))
                    .andExpect(status().isOk());
            verify(payslipService).getPayslipsByBatch(batchId);
        }
    }

    // ─── GET /accounts/active ──────────────────────────────────────────────────
    @Nested @DisplayName("GET /accounts/active")
    class GetActiveAccounts {

        @Test @DisplayName("200 – trả về danh sách tài khoản ACTIVE")
        void shouldReturn200() throws Exception {
            when(financeAccountRepository.findAllByStatus("ACTIVE")).thenReturn(List.of(financeAccount));
            mockMvc.perform(get("/api/v1/finance/payroll/accounts/active"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].accountName").value("Vietcombank HCM"))
                    .andExpect(jsonPath("$.data[0].status").value("ACTIVE"));
        }

        @Test @DisplayName("200 – list rỗng")
        void shouldReturn200Empty() throws Exception {
            when(financeAccountRepository.findAllByStatus("ACTIVE")).thenReturn(List.of());
            mockMvc.perform(get("/api/v1/finance/payroll/accounts/active"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(0)));
        }

        @Test @DisplayName("Gọi repository với status='ACTIVE'")
        void shouldQueryWithActiveStatus() throws Exception {
            when(financeAccountRepository.findAllByStatus("ACTIVE")).thenReturn(List.of());
            mockMvc.perform(get("/api/v1/finance/payroll/accounts/active")).andExpect(status().isOk());
            verify(financeAccountRepository).findAllByStatus("ACTIVE");
        }
    }
}