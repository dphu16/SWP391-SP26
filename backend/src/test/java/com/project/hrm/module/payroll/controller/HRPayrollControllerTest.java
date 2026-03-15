package com.project.hrm.module.payroll.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.hrm.common.auth.security.JwtUtil;
import com.project.hrm.common.auth.service.CustomUserDetailsService;
import com.project.hrm.module.corehr.exception.GlobalExceptionHandler;
import com.project.hrm.module.payroll.dto.RequestDTO.CreatePaymentRequestRequest;
import com.project.hrm.module.payroll.dto.RequestDTO.CreatePayrollPeriodRequest;
import com.project.hrm.module.payroll.dto.ResponseDTO.*;
import com.project.hrm.module.payroll.entity.FinanceAccount;
import com.project.hrm.module.payroll.enums.PaymentRequestStatus;
import com.project.hrm.module.payroll.enums.PaymentRequestType;
import com.project.hrm.module.payroll.enums.PayslipStatus;
import com.project.hrm.module.payroll.enums.SalaryInquiryStatus;
import com.project.hrm.module.payroll.exception.ResourceNotFoundException;
import com.project.hrm.module.payroll.repository.FinanceAccountRepository;
import com.project.hrm.module.payroll.service.*;
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

@WebMvcTest(HRPayrollController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("HRPayrollController Tests")
class HRPayrollControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private JwtUtil jwtUtil;
    @MockitoBean private CustomUserDetailsService customUserDetailsService;
    @MockitoBean private org.springframework.data.jpa.mapping.JpaMetamodelMappingContext jpaMappingContext;

    @MockitoBean private PayrollPeriodService periodService;
    @MockitoBean private PayslipService payslipService;
    @MockitoBean private SalaryInquiryService inquiryService;
    @MockitoBean private PaymentRequestService paymentRequestService;
    @MockitoBean private PayrollCalculationService calculationService;
    @MockitoBean private FinanceAccountRepository financeAccountRepository;

    private UUID periodId;
    private UUID batchId;
    private UUID payslipId;
    private UUID requesterId;
    private UUID inquiryId;
    private PayrollPeriodResponse periodResponse;
    private PayslipResponse payslipResponse;
    private PaymentRequestResponse paymentRequestResponse;
    private SalaryInquiryDto inquiryDto;
    private FinanceAccount financeAccount;

    @BeforeEach
    void setUp() {
        periodId    = UUID.randomUUID();
        batchId     = UUID.randomUUID();
        payslipId   = UUID.randomUUID();
        requesterId = UUID.randomUUID();
        inquiryId   = UUID.randomUUID();

        // PayrollPeriodResponse uses 'periodId' (not 'id')
        periodResponse = PayrollPeriodResponse.builder()
                .periodId(periodId).month(3).year(2025).build();

        // PayslipStatus: DRAFT, CONFIRMED, PAID, CANCELLED (no CALCULATED)
        payslipResponse = PayslipResponse.builder()
                .payslipId(payslipId).employeeId(UUID.randomUUID())
                .employeeName("Nguyen Van A").month(3).year(2025)
                .netSalary(new BigDecimal("10000000"))
                .status(PayslipStatus.DRAFT).details(List.of()).build();

        // PaymentRequestResponse uses 'requestId' and 'totalAmountRequested'
        paymentRequestResponse = PaymentRequestResponse.builder()
                .requestId(UUID.randomUUID()).payrollBatchId(batchId)
                .requesterId(requesterId).type(PaymentRequestType.SALARY)
                .status(PaymentRequestStatus.PENDING)
                .totalAmountRequested(new BigDecimal("500000000")).build();

        inquiryDto = SalaryInquiryDto.builder()
                .id(inquiryId).employeeId(UUID.randomUUID())
                .employeeName("Nguyen Van A").payslipId(payslipId)
                .subject("Sai lương").message("Lương tháng này tính sai")
                .status(SalaryInquiryStatus.OPEN).build();

        // FinanceAccount uses 'accountId' (not 'id')
        financeAccount = FinanceAccount.builder()
                .accountId(UUID.randomUUID()).accountName("Vietcombank HCM")
                .accountNumber("1234567890").status("ACTIVE").build();
    }

    // ─── POST /periods ──────────────────────────────────────────────────────────
    @Nested @DisplayName("POST /periods")
    class CreatePeriod {

        @Test @DisplayName("200 – tạo kỳ lương thành công")
        void shouldReturn200() throws Exception {
            CreatePayrollPeriodRequest body = new CreatePayrollPeriodRequest();
            body.setMonth(3); body.setYear(2025);
            when(periodService.createPeriod(any())).thenReturn(periodResponse);
            mockMvc.perform(post("/api/v1/hr/payroll/periods")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value(containsString("thành công")))
                    .andExpect(jsonPath("$.data.month").value(3))
                    .andExpect(jsonPath("$.data.year").value(2025));
        }

        @Test @DisplayName("400 – thiếu month")
        void shouldReturn400WhenMonthMissing() throws Exception {
            mockMvc.perform(post("/api/v1/hr/payroll/periods")
                            .contentType(MediaType.APPLICATION_JSON).content("{\"year\":2025}"))
                    .andExpect(status().isBadRequest());
        }

        @Test @DisplayName("400 – thiếu year")
        void shouldReturn400WhenYearMissing() throws Exception {
            mockMvc.perform(post("/api/v1/hr/payroll/periods")
                            .contentType(MediaType.APPLICATION_JSON).content("{\"month\":3}"))
                    .andExpect(status().isBadRequest());
        }

        @Test @DisplayName("Gọi periodService.createPeriod()")
        void shouldCallService() throws Exception {
            CreatePayrollPeriodRequest body = new CreatePayrollPeriodRequest();
            body.setMonth(3); body.setYear(2025);
            when(periodService.createPeriod(any())).thenReturn(periodResponse);
            mockMvc.perform(post("/api/v1/hr/payroll/periods")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk());
            verify(periodService).createPeriod(any());
        }
    }

    // ─── GET /periods ───────────────────────────────────────────────────────────
    @Nested @DisplayName("GET /periods")
    class GetAllPeriods {

        @Test @DisplayName("200 – trả về danh sách")
        void shouldReturn200() throws Exception {
            when(periodService.getAllPeriods()).thenReturn(List.of(periodResponse));
            mockMvc.perform(get("/api/v1/hr/payroll/periods"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].month").value(3));
        }

        @Test @DisplayName("200 – danh sách rỗng")
        void shouldReturn200Empty() throws Exception {
            when(periodService.getAllPeriods()).thenReturn(List.of());
            mockMvc.perform(get("/api/v1/hr/payroll/periods"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(0)));
        }
    }

    // ─── GET /periods/{periodId} ────────────────────────────────────────────────
    @Nested @DisplayName("GET /periods/{periodId}")
    class GetPeriod {

        @Test @DisplayName("200 – trả về period")
        void shouldReturn200() throws Exception {
            when(periodService.getPeriod(periodId)).thenReturn(periodResponse);
            mockMvc.perform(get("/api/v1/hr/payroll/periods/{id}", periodId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.periodId").value(periodId.toString()));
        }

        @Test @DisplayName("404 – period không tồn tại")
        void shouldReturn404() throws Exception {
            when(periodService.getPeriod(periodId))
                    .thenThrow(new ResourceNotFoundException("Period không tồn tại."));
            mockMvc.perform(get("/api/v1/hr/payroll/periods/{id}", periodId))
                    .andExpect(status().isNotFound());
        }
    }

    // ─── PUT /periods/{periodId}/close ─────────────────────────────────────────
    @Nested @DisplayName("PUT /periods/{periodId}/close")
    class ClosePeriod {

        @Test @DisplayName("200 – đóng kỳ lương thành công")
        void shouldReturn200() throws Exception {
            when(periodService.closePeriod(periodId)).thenReturn(periodResponse);
            mockMvc.perform(put("/api/v1/hr/payroll/periods/{id}/close", periodId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value(containsString("thành công")));
        }

        @Test @DisplayName("404 – period không tồn tại")
        void shouldReturn404() throws Exception {
            when(periodService.closePeriod(periodId))
                    .thenThrow(new ResourceNotFoundException("Period không tồn tại."));
            mockMvc.perform(put("/api/v1/hr/payroll/periods/{id}/close", periodId))
                    .andExpect(status().isNotFound());
        }
    }

    // ─── POST /batches/{batchId}/calculate ─────────────────────────────────────
    @Nested @DisplayName("POST /batches/{batchId}/calculate")
    class CalculatePayslips {

        @Test @DisplayName("200 – tính lương thành công")
        void shouldReturn200() throws Exception {
            when(payslipService.calculateForBatch(batchId)).thenReturn(List.of(payslipResponse));
            mockMvc.perform(post("/api/v1/hr/payroll/batches/{id}/calculate", batchId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(1)));
        }

        @Test @DisplayName("404 – batch không tồn tại")
        void shouldReturn404() throws Exception {
            when(payslipService.calculateForBatch(batchId))
                    .thenThrow(new ResourceNotFoundException("Batch không tồn tại."));
            mockMvc.perform(post("/api/v1/hr/payroll/batches/{id}/calculate", batchId))
                    .andExpect(status().isNotFound());
        }
    }

    // ─── GET /batches/{batchId}/payslips ───────────────────────────────────────
    @Nested @DisplayName("GET /batches/{batchId}/payslips")
    class GetPayslipsByBatch {

        @Test @DisplayName("200 – trả về danh sách payslip")
        void shouldReturn200() throws Exception {
            when(payslipService.getPayslipsByBatch(batchId)).thenReturn(List.of(payslipResponse));
            mockMvc.perform(get("/api/v1/hr/payroll/batches/{id}/payslips", batchId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].employeeName").value("Nguyen Van A"));
        }

        @Test @DisplayName("200 – danh sách rỗng")
        void shouldReturn200Empty() throws Exception {
            when(payslipService.getPayslipsByBatch(batchId)).thenReturn(List.of());
            mockMvc.perform(get("/api/v1/hr/payroll/batches/{id}/payslips", batchId))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(0)));
        }
    }

    // ─── PUT /batches/{batchId}/validate-all ───────────────────────────────────
    @Nested @DisplayName("PUT /batches/{batchId}/validate-all")
    class ValidateAll {

        @Test @DisplayName("200 – xác nhận tất cả payslip thành công")
        void shouldReturn200() throws Exception {
            PayslipResponse confirmed = PayslipResponse.builder()
                    .payslipId(payslipId).status(PayslipStatus.CONFIRMED).details(List.of()).build();
            when(payslipService.validateAllInBatch(batchId)).thenReturn(List.of(confirmed));
            mockMvc.perform(put("/api/v1/hr/payroll/batches/{id}/validate-all", batchId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0].status").value("CONFIRMED"));
        }

        @Test @DisplayName("404 – batch không tồn tại")
        void shouldReturn404() throws Exception {
            when(payslipService.validateAllInBatch(batchId))
                    .thenThrow(new ResourceNotFoundException("Batch không tồn tại."));
            mockMvc.perform(put("/api/v1/hr/payroll/batches/{id}/validate-all", batchId))
                    .andExpect(status().isNotFound());
        }
    }

    // ─── GET /batches/{batchId}/tax-report ─────────────────────────────────────
    @Nested @DisplayName("GET /batches/{batchId}/tax-report")
    class GetTaxReport {

        @Test @DisplayName("200 – trả về tax report")
        void shouldReturn200() throws Exception {
            // TaxReportResponse sử dụng 'taxAmount' (Double), không dùng BigDecimal
            TaxReportResponse taxReport = TaxReportResponse.builder()
                    .employeeName("Nguyen Van A").month(3).year(2025)
                    .taxAmount(500000.0).build();
            when(payslipService.getTaxReportByBatch(batchId)).thenReturn(List.of(taxReport));
            mockMvc.perform(get("/api/v1/hr/payroll/batches/{id}/tax-report", batchId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0].employeeName").value("Nguyen Van A"));
        }

        @Test @DisplayName("200 – danh sách rỗng")
        void shouldReturn200Empty() throws Exception {
            when(payslipService.getTaxReportByBatch(batchId)).thenReturn(List.of());
            mockMvc.perform(get("/api/v1/hr/payroll/batches/{id}/tax-report", batchId))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(0)));
        }
    }

    // ─── PUT /payslips/{payslipId}/confirm ─────────────────────────────────────
    @Nested @DisplayName("PUT /payslips/{payslipId}/confirm")
    class ConfirmPayslip {

        @Test @DisplayName("200 – xác nhận payslip thành công")
        void shouldReturn200() throws Exception {
            PayslipResponse confirmed = PayslipResponse.builder()
                    .payslipId(payslipId).status(PayslipStatus.CONFIRMED).details(List.of()).build();
            when(payslipService.confirmPayslip(payslipId)).thenReturn(confirmed);
            mockMvc.perform(put("/api/v1/hr/payroll/payslips/{id}/confirm", payslipId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value(containsString("thành công")))
                    .andExpect(jsonPath("$.data.status").value("CONFIRMED"));
        }

        @Test @DisplayName("404 – payslip không tồn tại")
        void shouldReturn404() throws Exception {
            when(payslipService.confirmPayslip(payslipId))
                    .thenThrow(new ResourceNotFoundException("Phiếu lương không tồn tại."));
            mockMvc.perform(put("/api/v1/hr/payroll/payslips/{id}/confirm", payslipId))
                    .andExpect(status().isNotFound());
        }

        @Test @DisplayName("Gọi service với đúng payslipId")
        void shouldCallService() throws Exception {
            PayslipResponse confirmed = PayslipResponse.builder()
                    .payslipId(payslipId).status(PayslipStatus.CONFIRMED).details(List.of()).build();
            when(payslipService.confirmPayslip(payslipId)).thenReturn(confirmed);
            mockMvc.perform(put("/api/v1/hr/payroll/payslips/{id}/confirm", payslipId))
                    .andExpect(status().isOk());
            verify(payslipService).confirmPayslip(payslipId);
        }
    }

    // ─── PUT /payslips/{payslipId}/cancel ──────────────────────────────────────
    @Nested @DisplayName("PUT /payslips/{payslipId}/cancel")
    class CancelPayslip {

        @Test @DisplayName("200 – huỷ payslip thành công")
        void shouldReturn200() throws Exception {
            PayslipResponse cancelled = PayslipResponse.builder()
                    .payslipId(payslipId).status(PayslipStatus.CANCELLED).details(List.of()).build();
            when(payslipService.cancelPayslip(payslipId)).thenReturn(cancelled);
            mockMvc.perform(put("/api/v1/hr/payroll/payslips/{id}/cancel", payslipId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("CANCELLED"));
        }

        @Test @DisplayName("404 – payslip không tồn tại")
        void shouldReturn404() throws Exception {
            when(payslipService.cancelPayslip(payslipId))
                    .thenThrow(new ResourceNotFoundException("Phiếu lương không tồn tại."));
            mockMvc.perform(put("/api/v1/hr/payroll/payslips/{id}/cancel", payslipId))
                    .andExpect(status().isNotFound());
        }
    }

    // ─── GET /finance-accounts/active ──────────────────────────────────────────
    @Nested @DisplayName("GET /finance-accounts/active")
    class GetActiveFinanceAccounts {

        @Test @DisplayName("200 – trả về danh sách tài khoản ACTIVE")
        void shouldReturn200() throws Exception {
            when(financeAccountRepository.findAllByStatus("ACTIVE")).thenReturn(List.of(financeAccount));
            mockMvc.perform(get("/api/v1/hr/payroll/finance-accounts/active"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].accountName").value("Vietcombank HCM"));
        }

        @Test @DisplayName("200 – danh sách rỗng")
        void shouldReturn200Empty() throws Exception {
            when(financeAccountRepository.findAllByStatus("ACTIVE")).thenReturn(List.of());
            mockMvc.perform(get("/api/v1/hr/payroll/finance-accounts/active"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(0)));
        }
    }

    // ─── POST /payment-requests ─────────────────────────────────────────────────
    @Nested @DisplayName("POST /payment-requests")
    class CreatePaymentRequest {

        @Test @DisplayName("200 – tạo payment request thành công")
        void shouldReturn200() throws Exception {
            CreatePaymentRequestRequest body = new CreatePaymentRequestRequest();
            body.setPayrollBatchId(batchId);
            body.setSourceAccountId(UUID.randomUUID());
            body.setType(PaymentRequestType.SALARY);
            when(paymentRequestService.createRequest(eq(requesterId), any()))
                    .thenReturn(paymentRequestResponse);
            mockMvc.perform(post("/api/v1/hr/payroll/payment-requests")
                            .requestAttr("employeeId", requesterId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value(containsString("Finance")))
                    .andExpect(jsonPath("$.data.status").value("PENDING"));
        }

        @Test @DisplayName("400 – thiếu payrollBatchId")
        void shouldReturn400WhenBatchIdMissing() throws Exception {
            String json = "{\"sourceAccountId\":\"" + UUID.randomUUID() + "\",\"type\":\"SALARY\"}";
            mockMvc.perform(post("/api/v1/hr/payroll/payment-requests")
                            .requestAttr("employeeId", requesterId)
                            .contentType(MediaType.APPLICATION_JSON).content(json))
                    .andExpect(status().isBadRequest());
        }

        @Test @DisplayName("Gọi service với đúng requesterId")
        void shouldCallService() throws Exception {
            CreatePaymentRequestRequest body = new CreatePaymentRequestRequest();
            body.setPayrollBatchId(batchId);
            body.setSourceAccountId(UUID.randomUUID());
            body.setType(PaymentRequestType.SALARY);
            when(paymentRequestService.createRequest(eq(requesterId), any()))
                    .thenReturn(paymentRequestResponse);
            mockMvc.perform(post("/api/v1/hr/payroll/payment-requests")
                            .requestAttr("employeeId", requesterId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk());
            verify(paymentRequestService).createRequest(eq(requesterId), any());
        }
    }

    // ─── GET /payment-requests/my ───────────────────────────────────────────────
    @Nested @DisplayName("GET /payment-requests/my")
    class GetMyPaymentRequests {

        @Test @DisplayName("200 – trả về danh sách request của HR")
        void shouldReturn200() throws Exception {
            when(paymentRequestService.getMyRequests(requesterId)).thenReturn(List.of(paymentRequestResponse));
            mockMvc.perform(get("/api/v1/hr/payroll/payment-requests/my")
                            .requestAttr("employeeId", requesterId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].status").value("PENDING"));
        }

        @Test @DisplayName("200 – danh sách rỗng")
        void shouldReturn200Empty() throws Exception {
            when(paymentRequestService.getMyRequests(requesterId)).thenReturn(List.of());
            mockMvc.perform(get("/api/v1/hr/payroll/payment-requests/my")
                            .requestAttr("employeeId", requesterId))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(0)));
        }

        @Test @DisplayName("Gọi service với đúng requesterId")
        void shouldCallService() throws Exception {
            when(paymentRequestService.getMyRequests(requesterId)).thenReturn(List.of());
            mockMvc.perform(get("/api/v1/hr/payroll/payment-requests/my")
                            .requestAttr("employeeId", requesterId))
                    .andExpect(status().isOk());
            verify(paymentRequestService).getMyRequests(requesterId);
        }
    }

    // ─── GET /inquiries ─────────────────────────────────────────────────────────
    @Nested @DisplayName("GET /inquiries")
    class GetAllInquiries {

        @Test @DisplayName("200 – trả về tất cả inquiry")
        void shouldReturn200() throws Exception {
            when(inquiryService.getAllInquiries()).thenReturn(List.of(inquiryDto));
            mockMvc.perform(get("/api/v1/hr/payroll/inquiries"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].subject").value("Sai lương"))
                    .andExpect(jsonPath("$.data[0].status").value("OPEN"));
        }

        @Test @DisplayName("200 – danh sách rỗng")
        void shouldReturn200Empty() throws Exception {
            when(inquiryService.getAllInquiries()).thenReturn(List.of());
            mockMvc.perform(get("/api/v1/hr/payroll/inquiries"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.data", hasSize(0)));
        }
    }

    // ─── PUT /inquiries/{id}/in-progress ───────────────────────────────────────
    @Nested @DisplayName("PUT /inquiries/{id}/in-progress")
    class MarkInProgress {

        @Test @DisplayName("200 – chuyển sang IN_PROGRESS")
        void shouldReturn200() throws Exception {
            SalaryInquiryDto inProgress = SalaryInquiryDto.builder()
                    .id(inquiryId).status(SalaryInquiryStatus.IN_PROGRESS).build();
            when(inquiryService.markInProgress(inquiryId)).thenReturn(inProgress);
            mockMvc.perform(put("/api/v1/hr/payroll/inquiries/{id}/in-progress", inquiryId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"));
        }

        @Test @DisplayName("404 – inquiry không tồn tại")
        void shouldReturn404() throws Exception {
            when(inquiryService.markInProgress(inquiryId))
                    .thenThrow(new ResourceNotFoundException("Không tìm thấy inquiry."));
            mockMvc.perform(put("/api/v1/hr/payroll/inquiries/{id}/in-progress", inquiryId))
                    .andExpect(status().isNotFound());
        }
    }

    // ─── PUT /inquiries/{id}/reject ─────────────────────────────────────────────
    @Nested @DisplayName("PUT /inquiries/{id}/reject")
    class RejectInquiry {

        @Test @DisplayName("200 – từ chối inquiry thành công")
        void shouldReturn200() throws Exception {
            SalaryInquiryDto rejected = SalaryInquiryDto.builder()
                    .id(inquiryId).status(SalaryInquiryStatus.REJECTED).build();
            when(inquiryService.rejectInquiry(eq(requesterId), eq(inquiryId), any())).thenReturn(rejected);
            mockMvc.perform(put("/api/v1/hr/payroll/inquiries/{id}/reject", inquiryId)
                            .requestAttr("employeeId", requesterId)
                            .param("reason", "Không hợp lệ"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("REJECTED"));
        }

        @Test @DisplayName("404 – inquiry không tồn tại")
        void shouldReturn404() throws Exception {
            when(inquiryService.rejectInquiry(any(), eq(inquiryId), any()))
                    .thenThrow(new ResourceNotFoundException("Không tìm thấy inquiry."));
            mockMvc.perform(put("/api/v1/hr/payroll/inquiries/{id}/reject", inquiryId)
                            .requestAttr("employeeId", requesterId)
                            .param("reason", "Không hợp lệ"))
                    .andExpect(status().isNotFound());
        }

        @Test @DisplayName("Gọi service với đúng params")
        void shouldCallService() throws Exception {
            SalaryInquiryDto rejected = SalaryInquiryDto.builder()
                    .id(inquiryId).status(SalaryInquiryStatus.REJECTED).build();
            when(inquiryService.rejectInquiry(eq(requesterId), eq(inquiryId), eq("Không hợp lệ")))
                    .thenReturn(rejected);
            mockMvc.perform(put("/api/v1/hr/payroll/inquiries/{id}/reject", inquiryId)
                            .requestAttr("employeeId", requesterId)
                            .param("reason", "Không hợp lệ"))
                    .andExpect(status().isOk());
            verify(inquiryService).rejectInquiry(requesterId, inquiryId, "Không hợp lệ");
        }
    }
}