/**
 * Payroll Service — Frontend API layer
 * Maps 1:1 to backend controllers:
 *   - HRPayrollController        → /api/v1/hr/payroll
 *   - EmployeePayrollController  → /api/v1/my
 *   - FinanceController          → /api/v1/finance/payroll
 */
import apiClient from "./apiClient";

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export type PayslipStatus = "DRAFT" | "CONFIRMED" | "PAID" | "CANCELLED";
export type InquiryStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
export type PeriodStatus = "OPEN" | "PAID" | "CLOSED";
export type BatchStatus = "DRAFT" | "VALIDATED" | "PROCESSED" | "LOCKED";
export type PaymentRequestStatus = "PENDING" | "APPROVED" | "PAID" | "REJECTED";
export type PaymentRequestType = "SALARY" | "TAX_INSURANCE";

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE DTOs — mirrors backend ResponseDTO exactly
// ═══════════════════════════════════════════════════════════════════════════════

/** PayrollPeriodResponse */
export interface PayrollPeriodResponse {
    periodId: string;
    batchId: string | null;  // UUID of the batch created alongside this period
    month: number;
    year: number;
    startDate: string;
    endDate: string;
    status: PeriodStatus;
    batchStatus: BatchStatus | null;
    createdAt: string | null;
}

/** PayslipResponse.DetailItem */
export interface PayslipDetailItem {
    itemName: string;
    amount: number;
    type: "ALLOWANCE" | "DEDUCTION" | "BASE";
}

/** PayslipResponse */
export interface PayslipResponse {
    payslipId: string;
    employeeId: string;
    employeeName: string;
    departmentName: string;
    batchId: string;
    periodId: string;
    month: number;
    year: number;
    // Chấm công
    totalOtHours: number;
    totalAbsentDays: number;
    totalWorkDays: number;
    // Lương
    baseSalary: number;
    otPay: number;
    absentDeduction: number;
    totalAllowances: number;
    grossSalary: number;
    taxAmount: number;
    insuranceAmount: number;
    totalDeductions: number;
    netSalary: number;
    // Trạng thái
    status: PayslipStatus;
    details: PayslipDetailItem[];
    confirmedAt: string | null;
    paidAt: string | null;
    createdAt: string | null;
}

/** TaxReportResponse */
export interface TaxReportResponse {
    employeeId: string;
    employeeCode: string;
    employeeName: string;
    department: string | null;
    position: string | null;
    month: number;
    year: number;
    baseSalary: number;
    grossSalary: number;
    taxAmount: number;
    insuranceAmount: number;
    totalDeductions: number;
    netSalary: number;
}

/** SalaryInquiryDto.HrResponseDetail */
export interface HrResponseDetail {
    responseId: string;
    responderName: string;
    officialResponse: string;
    attachmentUrl: string | null;
    createdAt: string | null;
}

/** SalaryInquiryDto */
export interface SalaryInquiryDto {
    id: string;
    employeeId: string;
    employeeName: string;
    payslipId: string | null;
    subject: string;
    message: string;
    status: InquiryStatus;
    createdAt: string;
    resolvedAt: string | null;
    hrResponse: HrResponseDetail | null;
}

/** PaymentRequestResponse */
export interface PaymentRequestResponse {
    requestId: string;
    payrollBatchId: string;
    requesterId: string;
    requesterName: string;
    sourceAccountId: string | null;
    sourceAccountName: string | null;
    totalAmountRequested: number;
    status: PaymentRequestStatus;
    hrNote: string | null;
    financeNote: string | null;
    reportUrl: string | null;
    type: PaymentRequestType;
    approvedAt: string | null;
    createdAt: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export interface CreatePayrollPeriodRequest {
    month: number;
    year: number;
}

export interface CreatePayrollBatchRequest {
    periodId: string;
    note?: string;
}

export interface CreatePaymentRequestRequest {
    payrollBatchId: string;
    sourceAccountId?: string;
    hrNote?: string;
    reportUrl?: string;
    type: PaymentRequestType;
}

export interface CreateSalaryInquiryRequest {
    payslipId?: string | null;
    subject: string;
    message: string;
}

export interface RespondToInquiryRequest {
    inquiryId: string;
    officialResponse: string;
    internalNote?: string;
    attachmentUrl?: string;
}

export interface ReviewPaymentRequestRequest {
    approved: boolean;
    financeNote?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ApiResponse wrapper (từ backend)
// ═══════════════════════════════════════════════════════════════════════════════
interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
    timestamp?: string;
}

// Helper để unwrap ApiResponse
async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
    const res = await promise;
    return res.data.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HR PAYROLL — PERIOD APIs
// Base: /api/v1/hr/payroll/periods
// ═══════════════════════════════════════════════════════════════════════════════

/** POST /api/v1/hr/payroll/periods — Tạo kỳ lương mới */
export async function createPeriod(request: CreatePayrollPeriodRequest): Promise<PayrollPeriodResponse> {
    return unwrap(apiClient.post<ApiResponse<PayrollPeriodResponse>>("/api/v1/hr/payroll/periods", request));
}

/** GET /api/v1/hr/payroll/periods — Danh sách tất cả kỳ lương */
export async function getAllPeriods(): Promise<PayrollPeriodResponse[]> {
    return unwrap(apiClient.get<ApiResponse<PayrollPeriodResponse[]>>("/api/v1/hr/payroll/periods"));
}

/** GET /api/v1/hr/payroll/periods/:id */
export async function getPeriod(periodId: string): Promise<PayrollPeriodResponse> {
    return unwrap(apiClient.get<ApiResponse<PayrollPeriodResponse>>(`/api/v1/hr/payroll/periods/${periodId}`));
}

/** PUT /api/v1/hr/payroll/periods/:id/close — Đóng kỳ lương */
export async function closePeriod(periodId: string): Promise<PayrollPeriodResponse> {
    return unwrap(apiClient.put<ApiResponse<PayrollPeriodResponse>>(`/api/v1/hr/payroll/periods/${periodId}/close`));
}

// ═══════════════════════════════════════════════════════════════════════════════
// HR PAYROLL — BATCH & PAYSLIP APIs
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/hr/payroll/batches/:batchId/payslips — Danh sách payslip trong batch */
export async function getPayslipsByBatch(batchId: string): Promise<PayslipResponse[]> {
    return unwrap(apiClient.get<ApiResponse<PayslipResponse[]>>(`/api/v1/hr/payroll/batches/${batchId}/payslips`));
}

/** POST /api/v1/hr/payroll/batches/:batchId/calculate — Chạy máy tính lương */
export async function calculatePayslips(batchId: string): Promise<PayslipResponse[]> {
    return unwrap(apiClient.post<ApiResponse<PayslipResponse[]>>(`/api/v1/hr/payroll/batches/${batchId}/calculate`));
}

/** PUT /api/v1/hr/payroll/batches/:batchId/validate-all — Xác nhận tất cả payslip trong batch */
export async function validateAllInBatch(batchId: string): Promise<PayslipResponse[]> {
    return unwrap(apiClient.put<ApiResponse<PayslipResponse[]>>(`/api/v1/hr/payroll/batches/${batchId}/validate-all`));
}

/** GET /api/v1/hr/payroll/batches/:batchId/tax-report — Danh sách Tax Report trong batch */
export async function getTaxReportByBatch(batchId: string): Promise<TaxReportResponse[]> {
    return unwrap(apiClient.get<ApiResponse<TaxReportResponse[]>>(`/api/v1/hr/payroll/batches/${batchId}/tax-report`));
}

/** PUT /api/v1/hr/payroll/payslips/:id/confirm — Xác nhận phiếu lương */
export async function confirmPayslip(payslipId: string): Promise<PayslipResponse> {
    return unwrap(apiClient.put<ApiResponse<PayslipResponse>>(`/api/v1/hr/payroll/payslips/${payslipId}/confirm`));
}

/** PUT /api/v1/hr/payroll/payslips/:id/cancel — Huỷ phiếu lương */
export async function cancelPayslip(payslipId: string): Promise<PayslipResponse> {
    return unwrap(apiClient.put<ApiResponse<PayslipResponse>>(`/api/v1/hr/payroll/payslips/${payslipId}/cancel`));
}

// ═══════════════════════════════════════════════════════════════════════════════
// HR PAYROLL — PAYMENT REQUEST APIs
// ═══════════════════════════════════════════════════════════════════════════════

/** POST /api/v1/hr/payroll/payment-requests — HR gửi yêu cầu thanh toán sang Finance */
export async function createPaymentRequest(request: CreatePaymentRequestRequest): Promise<PaymentRequestResponse> {
    return unwrap(apiClient.post<ApiResponse<PaymentRequestResponse>>("/api/v1/hr/payroll/payment-requests", request));
}

/** GET /api/v1/hr/payroll/payment-requests/my — Lịch sử yêu cầu HR đã gửi */
export async function getMyPaymentRequests(): Promise<PaymentRequestResponse[]> {
    return unwrap(apiClient.get<ApiResponse<PaymentRequestResponse[]>>("/api/v1/hr/payroll/payment-requests/my"));
}

// ═══════════════════════════════════════════════════════════════════════════════
// HR PAYROLL — INQUIRY APIs
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/hr/payroll/inquiries — Tất cả các ticket */
export async function getAllInquiries(): Promise<SalaryInquiryDto[]> {
    return unwrap(apiClient.get<ApiResponse<SalaryInquiryDto[]>>("/api/v1/hr/payroll/inquiries"));
}

/** PUT /api/v1/hr/payroll/inquiries/:id/in-progress */
export async function markInquiryInProgress(inquiryId: string): Promise<SalaryInquiryDto> {
    return unwrap(apiClient.put<ApiResponse<SalaryInquiryDto>>(`/api/v1/hr/payroll/inquiries/${inquiryId}/in-progress`));
}

/** POST /api/v1/hr/payroll/inquiries/respond — HR phản hồi thắc mắc */
export async function respondToInquiry(request: RespondToInquiryRequest): Promise<SalaryInquiryDto> {
    return unwrap(apiClient.post<ApiResponse<SalaryInquiryDto>>("/api/v1/hr/payroll/inquiries/respond", request));
}

/** PUT /api/v1/hr/payroll/inquiries/:id/reject — Từ chối thắc mắc */
export async function rejectInquiry(inquiryId: string, reason: string): Promise<SalaryInquiryDto> {
    return unwrap(apiClient.put<ApiResponse<SalaryInquiryDto>>(`/api/v1/hr/payroll/inquiries/${inquiryId}/reject?reason=${encodeURIComponent(reason)}`));
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYEE PAYROLL — /api/v1/my
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/my/payslips — Danh sách phiếu lương của mình */
export async function getMyPayslips(): Promise<PayslipResponse[]> {
    return unwrap(apiClient.get<ApiResponse<PayslipResponse[]>>("/api/v1/my/payslips"));
}

/** GET /api/v1/my/payslips/:id — Chi tiết 1 phiếu lương */
export async function getMyPayslipDetail(payslipId: string): Promise<PayslipResponse> {
    return unwrap(apiClient.get<ApiResponse<PayslipResponse>>(`/api/v1/my/payslips/${payslipId}`));
}

/** GET /api/v1/my/payslips/:id/pdf — Tải PDF phiếu lương */
export async function downloadPayslipPdf(payslipId: string): Promise<Blob> {
    const res = await apiClient.get(`/api/v1/my/payslips/${payslipId}/pdf`, {
        responseType: "blob",
    });
    return res.data;
}

/** GET /api/v1/my/inquiries — Danh sách thắc mắc đã gửi */
export async function getMyInquiries(): Promise<SalaryInquiryDto[]> {
    return unwrap(apiClient.get<ApiResponse<SalaryInquiryDto[]>>("/api/v1/my/inquiries"));
}

/** POST /api/v1/my/inquiries — Tạo thắc mắc mới */
export async function createInquiry(request: CreateSalaryInquiryRequest): Promise<SalaryInquiryDto> {
    return unwrap(apiClient.post<ApiResponse<SalaryInquiryDto>>("/api/v1/my/inquiries", request));
}

// ═══════════════════════════════════════════════════════════════════════════════
// FINANCE — /api/v1/finance/payroll
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/v1/finance/payroll/payment-requests/pending — Danh sách yêu cầu chờ duyệt */
export async function getFinancePendingRequests(): Promise<PaymentRequestResponse[]> {
    return unwrap(apiClient.get<ApiResponse<PaymentRequestResponse[]>>("/api/v1/finance/payroll/payment-requests/pending"));
}

/** GET /api/v1/finance/payroll/payment-requests — Toàn bộ lịch sử yêu cầu */
export async function getFinanceAllRequests(): Promise<PaymentRequestResponse[]> {
    return unwrap(apiClient.get<ApiResponse<PaymentRequestResponse[]>>("/api/v1/finance/payroll/payment-requests"));
}

/** GET /api/v1/finance/payroll/batches/:batchId/payslips — Xem payslips detail */
export async function getFinanceBatchPayslips(batchId: string): Promise<PayslipResponse[]> {
    return unwrap(apiClient.get<ApiResponse<PayslipResponse[]>>(`/api/v1/finance/payroll/batches/${batchId}/payslips`));
}

/** PUT /api/v1/finance/payroll/payment-requests/:id/review — Duyệt hoặc từ chối */
export async function reviewPaymentRequest(
    requestId: string,
    request: ReviewPaymentRequestRequest
): Promise<PaymentRequestResponse> {
    return unwrap(apiClient.put<ApiResponse<PaymentRequestResponse>>(
        `/api/v1/finance/payroll/payment-requests/${requestId}/review`,
        request
    ));
}

/** GET /api/v1/hr/payroll/finance-accounts/active — Lấy danh sách tài khoản nguồn đang hoạt động */
export async function getActiveFinanceAccounts(): Promise<any[]> {
    return unwrap(apiClient.get<ApiResponse<any[]>>("/api/v1/hr/payroll/finance-accounts/active"));
}

/** GET /api/v1/finance/payroll/batches/:batchId/tax-report — Xem chi tiết Thuế & Bảo hiểm */
export async function getFinanceTaxReport(batchId: string): Promise<TaxReportResponse[]> {
    return unwrap(apiClient.get<ApiResponse<TaxReportResponse[]>>(`/api/v1/finance/payroll/batches/${batchId}/tax-report`));
}

/** GET /api/v1/finance/payroll/payment-requests/:id/download — Tải PDF báo cáo */
export async function downloadPaymentReport(requestId: string): Promise<Blob> {
    const res = await apiClient.get(`/api/v1/finance/payroll/payment-requests/${requestId}/download`, {
        responseType: "blob",
    });
    return res.data;
}
