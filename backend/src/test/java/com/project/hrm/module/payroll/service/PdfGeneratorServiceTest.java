package com.project.hrm.module.payroll.service;

import com.project.hrm.module.payroll.dto.ResponseDTO.PaymentRequestResponse;
import com.project.hrm.module.payroll.dto.ResponseDTO.PayslipResponse;
import com.project.hrm.module.payroll.dto.ResponseDTO.TaxReportResponse;
import com.project.hrm.module.payroll.enums.PaymentRequestStatus;
import com.project.hrm.module.payroll.enums.PaymentRequestType;
import com.project.hrm.module.payroll.enums.PayslipStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests cho PdfGeneratorService.
 *
 * PdfGeneratorService không có dependency → test thuần, không cần Mockito.
 * PDF hợp lệ bắt đầu bằng magic bytes: %PDF  (hex: 25 50 44 46)
 */
@DisplayName("PdfGeneratorService Tests")
class PdfGeneratorServiceTest {

    // PDF magic bytes: %PDF
    private static final byte[] PDF_MAGIC = new byte[]{0x25, 0x50, 0x44, 0x46};

    private PdfGeneratorService pdfGeneratorService;

    // ─── Common fixtures ───────────────────────────────────────────────────────
    private PayslipResponse         payslip;
    private PaymentRequestResponse  paymentRequest;
    private TaxReportResponse       taxReport;

    @BeforeEach
    void setUp() {
        pdfGeneratorService = new PdfGeneratorService();

        payslip = PayslipResponse.builder()
                .payslipId(UUID.randomUUID())
                .employeeId(UUID.randomUUID())
                .employeeName("Nguyen Van A")
                .departmentName("Engineering")
                .batchId(UUID.randomUUID())
                .periodId(UUID.randomUUID())
                .month(3)
                .year(2025)
                .baseSalary(new BigDecimal("10000000"))
                .otPay(new BigDecimal("500000"))
                .totalAllowances(new BigDecimal("2000000"))
                .absentDeduction(new BigDecimal("0"))
                .grossSalary(new BigDecimal("12500000"))
                .taxAmount(new BigDecimal("1000000"))
                .insuranceAmount(new BigDecimal("800000"))
                .totalDeductions(new BigDecimal("1800000"))
                .netSalary(new BigDecimal("10700000"))
                .status(PayslipStatus.CONFIRMED)
                .details(List.of())
                .build();

        paymentRequest = PaymentRequestResponse.builder()
                .requestId(UUID.randomUUID())
                .payrollBatchId(UUID.randomUUID())
                .requesterId(UUID.randomUUID())
                .totalAmountRequested(new BigDecimal("50000000"))
                .status(PaymentRequestStatus.PENDING)
                .type(PaymentRequestType.SALARY)
                .createdAt(OffsetDateTime.now())
                .build();

        taxReport = TaxReportResponse.builder()
                .employeeId(UUID.randomUUID())
                .employeeCode("EMP001")
                .employeeName("Nguyen Van A")
                .department("Engineering")
                .position("Developer")
                .month(3)
                .year(2025)
                .baseSalary(10000000.0)
                .grossSalary(12500000.0)
                .taxAmount(1000000.0)
                .insuranceAmount(800000.0)
                .totalDeductions(1800000.0)
                .netSalary(10700000.0)
                .build();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. generatePayslipPdf
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("1. generatePayslipPdf")
    class GeneratePayslipPdf {

        @Test
        @DisplayName("Trả về byte array không rỗng")
        void shouldReturnNonEmptyByteArray() {
            byte[] result = pdfGeneratorService.generatePayslipPdf(payslip);

            assertThat(result).isNotNull().isNotEmpty();
        }

        @Test
        @DisplayName("Byte array bắt đầu bằng PDF magic bytes (%PDF)")
        void shouldStartWithPdfMagicBytes() {
            byte[] result = pdfGeneratorService.generatePayslipPdf(payslip);

            assertThat(result).hasSizeGreaterThan(4);
            assertThat(result[0]).isEqualTo(PDF_MAGIC[0]); // %
            assertThat(result[1]).isEqualTo(PDF_MAGIC[1]); // P
            assertThat(result[2]).isEqualTo(PDF_MAGIC[2]); // D
            assertThat(result[3]).isEqualTo(PDF_MAGIC[3]); // F
        }

        @Test
        @DisplayName("PDF có kích thước hợp lý (> 1KB)")
        void shouldGeneratePdfWithReasonableSize() {
            byte[] result = pdfGeneratorService.generatePayslipPdf(payslip);

            assertThat(result.length).isGreaterThan(1024);
        }

        @Test
        @DisplayName("Không throw exception với payslip hợp lệ đầy đủ")
        void shouldNotThrow_WithValidPayslip() {
            assertThatNoException()
                    .isThrownBy(() -> pdfGeneratorService.generatePayslipPdf(payslip));
        }

        @Test
        @DisplayName("Không throw exception khi các trường số tiền = null")
        void shouldNotThrow_WhenAmountsAreNull() {
            PayslipResponse nullAmounts = PayslipResponse.builder()
                    .payslipId(UUID.randomUUID())
                    .employeeId(UUID.randomUUID())
                    .employeeName("Test Employee")
                    .batchId(UUID.randomUUID())
                    .periodId(UUID.randomUUID())
                    .month(3).year(2025)
                    .baseSalary(null)
                    .otPay(null)
                    .totalAllowances(null)
                    .absentDeduction(null)
                    .grossSalary(null)
                    .taxAmount(null)
                    .insuranceAmount(null)
                    .netSalary(null)
                    .details(List.of())
                    .build();

            assertThatNoException()
                    .isThrownBy(() -> pdfGeneratorService.generatePayslipPdf(nullAmounts));
        }

        @Test
        @DisplayName("Không throw exception khi employeeName chứa ký tự tiếng Việt")
        void shouldNotThrow_WithVietnameseName() {
            PayslipResponse vietnameseName = PayslipResponse.builder()
                    .payslipId(UUID.randomUUID())
                    .employeeId(UUID.randomUUID())
                    .employeeName("Nguyễn Văn Ánh")
                    .batchId(UUID.randomUUID())
                    .periodId(UUID.randomUUID())
                    .month(3).year(2025)
                    .baseSalary(new BigDecimal("10000000"))
                    .otPay(BigDecimal.ZERO)
                    .totalAllowances(BigDecimal.ZERO)
                    .absentDeduction(BigDecimal.ZERO)
                    .grossSalary(new BigDecimal("10000000"))
                    .taxAmount(new BigDecimal("1000000"))
                    .insuranceAmount(new BigDecimal("800000"))
                    .netSalary(new BigDecimal("8200000"))
                    .details(List.of())
                    .build();

            assertThatNoException()
                    .isThrownBy(() -> pdfGeneratorService.generatePayslipPdf(vietnameseName));
        }

        @Test
        @DisplayName("Hai lần generate cùng payslip cho ra PDF có kích thước xấp xỉ nhau")
        void shouldGenerateSimilarSizePdf_ForSamePayslip() {
            byte[] result1 = pdfGeneratorService.generatePayslipPdf(payslip);
            byte[] result2 = pdfGeneratorService.generatePayslipPdf(payslip);

            // Kích thước xấp xỉ nhau (sai số < 5%)
            double ratio = (double) result1.length / result2.length;
            assertThat(ratio).isBetween(0.95, 1.05);
        }

        @Test
        @DisplayName("Không throw exception khi details = null")
        void shouldNotThrow_WhenDetailsNull() {
            PayslipResponse withNullDetails = PayslipResponse.builder()
                    .payslipId(UUID.randomUUID())
                    .employeeId(UUID.randomUUID())
                    .employeeName("Test")
                    .batchId(UUID.randomUUID())
                    .periodId(UUID.randomUUID())
                    .month(3).year(2025)
                    .baseSalary(new BigDecimal("10000000"))
                    .otPay(BigDecimal.ZERO)
                    .totalAllowances(BigDecimal.ZERO)
                    .absentDeduction(BigDecimal.ZERO)
                    .grossSalary(new BigDecimal("10000000"))
                    .taxAmount(BigDecimal.ZERO)
                    .insuranceAmount(BigDecimal.ZERO)
                    .netSalary(new BigDecimal("10000000"))
                    .details(null)
                    .build();

            assertThatNoException()
                    .isThrownBy(() -> pdfGeneratorService.generatePayslipPdf(withNullDetails));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. generateBankTransferPdf
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("2. generateBankTransferPdf")
    class GenerateBankTransferPdf {

        @Test
        @DisplayName("Trả về byte array không rỗng")
        void shouldReturnNonEmptyByteArray() {
            byte[] result = pdfGeneratorService.generateBankTransferPdf(
                    paymentRequest, List.of(payslip));

            assertThat(result).isNotNull().isNotEmpty();
        }

        @Test
        @DisplayName("Byte array bắt đầu bằng PDF magic bytes (%PDF)")
        void shouldStartWithPdfMagicBytes() {
            byte[] result = pdfGeneratorService.generateBankTransferPdf(
                    paymentRequest, List.of(payslip));

            assertThat(result[0]).isEqualTo(PDF_MAGIC[0]);
            assertThat(result[1]).isEqualTo(PDF_MAGIC[1]);
            assertThat(result[2]).isEqualTo(PDF_MAGIC[2]);
            assertThat(result[3]).isEqualTo(PDF_MAGIC[3]);
        }

        @Test
        @DisplayName("PDF có kích thước hợp lý (> 1KB)")
        void shouldGeneratePdfWithReasonableSize() {
            byte[] result = pdfGeneratorService.generateBankTransferPdf(
                    paymentRequest, List.of(payslip));

            assertThat(result.length).isGreaterThan(1024);
        }

        @Test
        @DisplayName("Không throw exception với list payslip hợp lệ")
        void shouldNotThrow_WithValidPayslips() {
            assertThatNoException().isThrownBy(() ->
                    pdfGeneratorService.generateBankTransferPdf(
                            paymentRequest, List.of(payslip)));
        }

        @Test
        @DisplayName("Không throw exception khi list payslip rỗng")
        void shouldNotThrow_WithEmptyPayslipList() {
            assertThatNoException().isThrownBy(() ->
                    pdfGeneratorService.generateBankTransferPdf(
                            paymentRequest, List.of()));
        }

        @Test
        @DisplayName("PDF lớn hơn khi có nhiều payslip hơn")
        void shouldGenerateLargerPdf_WithMorePayslips() {
            PayslipResponse payslip2 = buildExtraPayslip("Tran Thi B");
            PayslipResponse payslip3 = buildExtraPayslip("Le Van C");

            byte[] single = pdfGeneratorService.generateBankTransferPdf(
                    paymentRequest, List.of(payslip));
            byte[] multiple = pdfGeneratorService.generateBankTransferPdf(
                    paymentRequest, List.of(payslip, payslip2, payslip3));

            assertThat(multiple.length).isGreaterThan(single.length);
        }

        @Test
        @DisplayName("Không throw exception khi requestId = null")
        void shouldNotThrow_WhenRequestIdIsNull() {
            PaymentRequestResponse nullId = PaymentRequestResponse.builder()
                    .requestId(null)
                    .payrollBatchId(UUID.randomUUID())
                    .totalAmountRequested(new BigDecimal("50000000"))
                    .status(PaymentRequestStatus.PENDING)
                    .type(PaymentRequestType.SALARY)
                    .createdAt(OffsetDateTime.now())
                    .build();

            assertThatNoException().isThrownBy(() ->
                    pdfGeneratorService.generateBankTransferPdf(nullId, List.of(payslip)));
        }

        @Test
        @DisplayName("Không throw exception khi createdAt = null")
        void shouldNotThrow_WhenCreatedAtIsNull() {
            PaymentRequestResponse nullDate = PaymentRequestResponse.builder()
                    .requestId(UUID.randomUUID())
                    .payrollBatchId(UUID.randomUUID())
                    .totalAmountRequested(new BigDecimal("50000000"))
                    .status(PaymentRequestStatus.PENDING)
                    .type(PaymentRequestType.SALARY)
                    .createdAt(null)
                    .build();

            assertThatNoException().isThrownBy(() ->
                    pdfGeneratorService.generateBankTransferPdf(nullDate, List.of(payslip)));
        }

        @Test
        @DisplayName("Không throw exception khi employeeName chứa ký tự tiếng Việt")
        void shouldNotThrow_WithVietnameseEmployeeName() {
            PayslipResponse vn = buildExtraPayslip("Trần Thị Bích Ngọc");

            assertThatNoException().isThrownBy(() ->
                    pdfGeneratorService.generateBankTransferPdf(
                            paymentRequest, List.of(vn)));
        }

        @Test
        @DisplayName("Không throw exception khi netSalary = null")
        void shouldNotThrow_WhenNetSalaryIsNull() {
            PayslipResponse nullSalary = PayslipResponse.builder()
                    .payslipId(UUID.randomUUID())
                    .employeeId(UUID.randomUUID())
                    .employeeName("Test")
                    .batchId(UUID.randomUUID())
                    .periodId(UUID.randomUUID())
                    .month(3).year(2025)
                    .netSalary(null)
                    .details(List.of())
                    .build();

            assertThatNoException().isThrownBy(() ->
                    pdfGeneratorService.generateBankTransferPdf(
                            paymentRequest, List.of(nullSalary)));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. generateTaxInsurancePdf
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("3. generateTaxInsurancePdf")
    class GenerateTaxInsurancePdf {

        @Test
        @DisplayName("Trả về byte array không rỗng")
        void shouldReturnNonEmptyByteArray() {
            byte[] result = pdfGeneratorService.generateTaxInsurancePdf(
                    paymentRequest, List.of(taxReport));

            assertThat(result).isNotNull().isNotEmpty();
        }

        @Test
        @DisplayName("Byte array bắt đầu bằng PDF magic bytes (%PDF)")
        void shouldStartWithPdfMagicBytes() {
            byte[] result = pdfGeneratorService.generateTaxInsurancePdf(
                    paymentRequest, List.of(taxReport));

            assertThat(result[0]).isEqualTo(PDF_MAGIC[0]);
            assertThat(result[1]).isEqualTo(PDF_MAGIC[1]);
            assertThat(result[2]).isEqualTo(PDF_MAGIC[2]);
            assertThat(result[3]).isEqualTo(PDF_MAGIC[3]);
        }

        @Test
        @DisplayName("PDF có kích thước hợp lý (> 1KB)")
        void shouldGeneratePdfWithReasonableSize() {
            byte[] result = pdfGeneratorService.generateTaxInsurancePdf(
                    paymentRequest, List.of(taxReport));

            assertThat(result.length).isGreaterThan(1024);
        }

        @Test
        @DisplayName("Không throw exception với tax report hợp lệ")
        void shouldNotThrow_WithValidTaxReport() {
            assertThatNoException().isThrownBy(() ->
                    pdfGeneratorService.generateTaxInsurancePdf(
                            paymentRequest, List.of(taxReport)));
        }

        @Test
        @DisplayName("Không throw exception khi list tax report rỗng")
        void shouldNotThrow_WithEmptyTaxReportList() {
            assertThatNoException().isThrownBy(() ->
                    pdfGeneratorService.generateTaxInsurancePdf(
                            paymentRequest, List.of()));
        }

        @Test
        @DisplayName("PDF lớn hơn khi có nhiều tax report")
        void shouldGenerateLargerPdf_WithMoreReports() {
            TaxReportResponse report2 = buildExtraTaxReport("Tran Thi B", "EMP002");
            TaxReportResponse report3 = buildExtraTaxReport("Le Van C",   "EMP003");

            byte[] single = pdfGeneratorService.generateTaxInsurancePdf(
                    paymentRequest, List.of(taxReport));
            byte[] multiple = pdfGeneratorService.generateTaxInsurancePdf(
                    paymentRequest, List.of(taxReport, report2, report3));

            assertThat(multiple.length).isGreaterThan(single.length);
        }

        @Test
        @DisplayName("Không throw exception khi employeeId = null")
        void shouldNotThrow_WhenEmployeeIdIsNull() {
            TaxReportResponse nullId = TaxReportResponse.builder()
                    .employeeId(null)
                    .employeeCode("EMP099")
                    .employeeName("Test Employee")
                    .grossSalary(10000000.0)
                    .taxAmount(1000000.0)
                    .insuranceAmount(800000.0)
                    .netSalary(8200000.0)
                    .build();

            assertThatNoException().isThrownBy(() ->
                    pdfGeneratorService.generateTaxInsurancePdf(
                            paymentRequest, List.of(nullId)));
        }

        @Test
        @DisplayName("Không throw exception khi các trường Double = null")
        void shouldNotThrow_WhenDoubleFieldsAreNull() {
            TaxReportResponse nullAmounts = TaxReportResponse.builder()
                    .employeeId(UUID.randomUUID())
                    .employeeName("Test")
                    .grossSalary(null)
                    .taxAmount(null)
                    .insuranceAmount(null)
                    .netSalary(null)
                    .build();

            assertThatNoException().isThrownBy(() ->
                    pdfGeneratorService.generateTaxInsurancePdf(
                            paymentRequest, List.of(nullAmounts)));
        }

        @Test
        @DisplayName("Không throw exception khi employeeName tiếng Việt")
        void shouldNotThrow_WithVietnameseName() {
            TaxReportResponse vn = buildExtraTaxReport("Lê Thị Ánh Tuyết", "EMP010");

            assertThatNoException().isThrownBy(() ->
                    pdfGeneratorService.generateTaxInsurancePdf(
                            paymentRequest, List.of(vn)));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. removeAccents & formatCurrency (gián tiếp qua output)
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("4. Internal helpers – via PDF output")
    class InternalHelpers {

        @Test
        @DisplayName("Ký tự đặc biệt Đ/đ được xử lý không throw exception")
        void shouldHandleDCharacter_WithoutException() {
            PayslipResponse dChar = PayslipResponse.builder()
                    .payslipId(UUID.randomUUID())
                    .employeeId(UUID.randomUUID())
                    .employeeName("Đặng Văn Đức")
                    .batchId(UUID.randomUUID())
                    .periodId(UUID.randomUUID())
                    .month(3).year(2025)
                    .baseSalary(new BigDecimal("10000000"))
                    .otPay(BigDecimal.ZERO)
                    .totalAllowances(BigDecimal.ZERO)
                    .absentDeduction(BigDecimal.ZERO)
                    .grossSalary(new BigDecimal("10000000"))
                    .taxAmount(BigDecimal.ZERO)
                    .insuranceAmount(BigDecimal.ZERO)
                    .netSalary(new BigDecimal("10000000"))
                    .details(List.of())
                    .build();

            byte[] result = pdfGeneratorService.generatePayslipPdf(dChar);

            assertThat(result).isNotEmpty();
        }

        @Test
        @DisplayName("formatCurrency: BigDecimal = 0 tạo PDF hợp lệ")
        void shouldFormatZeroAmount_WithoutException() {
            PayslipResponse zeroes = PayslipResponse.builder()
                    .payslipId(UUID.randomUUID())
                    .employeeId(UUID.randomUUID())
                    .employeeName("Zero Test")
                    .batchId(UUID.randomUUID())
                    .periodId(UUID.randomUUID())
                    .month(1).year(2025)
                    .baseSalary(BigDecimal.ZERO)
                    .otPay(BigDecimal.ZERO)
                    .totalAllowances(BigDecimal.ZERO)
                    .absentDeduction(BigDecimal.ZERO)
                    .grossSalary(BigDecimal.ZERO)
                    .taxAmount(BigDecimal.ZERO)
                    .insuranceAmount(BigDecimal.ZERO)
                    .netSalary(BigDecimal.ZERO)
                    .details(List.of())
                    .build();

            byte[] result = pdfGeneratorService.generatePayslipPdf(zeroes);

            assertThat(result).isNotEmpty();
            assertThat(result[0]).isEqualTo(PDF_MAGIC[0]);
        }

        @Test
        @DisplayName("formatCurrency: Double = 0.0 trong TaxReport tạo PDF hợp lệ")
        void shouldFormatZeroDouble_WithoutException() {
            TaxReportResponse zeroReport = TaxReportResponse.builder()
                    .employeeId(UUID.randomUUID())
                    .employeeName("Zero Employee")
                    .grossSalary(0.0)
                    .taxAmount(0.0)
                    .insuranceAmount(0.0)
                    .netSalary(0.0)
                    .build();

            byte[] result = pdfGeneratorService.generateTaxInsurancePdf(
                    paymentRequest, List.of(zeroReport));

            assertThat(result).isNotEmpty();
        }

        @Test
        @DisplayName("formatDate: OffsetDateTime null → không throw exception (Bank Transfer)")
        void shouldHandleNullDate_InBankTransfer() {
            PaymentRequestResponse nullCreatedAt = PaymentRequestResponse.builder()
                    .requestId(UUID.randomUUID())
                    .payrollBatchId(UUID.randomUUID())
                    .status(PaymentRequestStatus.PENDING)
                    .type(PaymentRequestType.SALARY)
                    .createdAt(null)
                    .build();

            byte[] result = pdfGeneratorService.generateBankTransferPdf(
                    nullCreatedAt, List.of(payslip));

            assertThat(result).isNotEmpty();
        }

        @Test
        @DisplayName("Ba phương thức generate độc lập nhau, không ảnh hưởng lẫn nhau")
        void shouldGenerateIndependently_AllThreeMethods() {
            byte[] payslipPdf = pdfGeneratorService.generatePayslipPdf(payslip);
            byte[] bankPdf    = pdfGeneratorService.generateBankTransferPdf(
                    paymentRequest, List.of(payslip));
            byte[] taxPdf     = pdfGeneratorService.generateTaxInsurancePdf(
                    paymentRequest, List.of(taxReport));

            assertThat(payslipPdf).isNotEmpty();
            assertThat(bankPdf).isNotEmpty();
            assertThat(taxPdf).isNotEmpty();

            // Ba file PDF phải khác nhau về nội dung
            assertThat(payslipPdf).isNotEqualTo(bankPdf);
            assertThat(bankPdf).isNotEqualTo(taxPdf);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    private PayslipResponse buildExtraPayslip(String name) {
        return PayslipResponse.builder()
                .payslipId(UUID.randomUUID())
                .employeeId(UUID.randomUUID())
                .employeeName(name)
                .batchId(UUID.randomUUID())
                .periodId(UUID.randomUUID())
                .month(3).year(2025)
                .baseSalary(new BigDecimal("9000000"))
                .otPay(BigDecimal.ZERO)
                .totalAllowances(BigDecimal.ZERO)
                .absentDeduction(BigDecimal.ZERO)
                .grossSalary(new BigDecimal("9000000"))
                .taxAmount(new BigDecimal("900000"))
                .insuranceAmount(new BigDecimal("720000"))
                .netSalary(new BigDecimal("7380000"))
                .details(List.of())
                .build();
    }

    private TaxReportResponse buildExtraTaxReport(String name, String code) {
        return TaxReportResponse.builder()
                .employeeId(UUID.randomUUID())
                .employeeCode(code)
                .employeeName(name)
                .department("Engineering")
                .position("Developer")
                .month(3).year(2025)
                .baseSalary(9000000.0)
                .grossSalary(9000000.0)
                .taxAmount(900000.0)
                .insuranceAmount(720000.0)
                .netSalary(7380000.0)
                .build();
    }
}