/**
 * Payroll Service — Frontend API layer
 * Maps 1:1 to backend controllers:
 *   - EmployeePayslipController  → /api/v1/employee/payslips
 *   - EmployeeInquiryController  → /api/v1/employee/inquiries
 *   - HrPayrollController        → /api/v1/hr/payroll
 *   - PayrollReviewController    → /api/v1/hr/payroll-review
 */
import apiClient from "./apiClient";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES — mirrors backend DTOs exactly
// ═══════════════════════════════════════════════════════════════════════════════

// --- Enums (from backend enums/) ---
export type PayslipStatus = "DRAFT" | "CONFIRMED" | "PAID" | "CANCELLED";
export type InquiryStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
export type BatchStatus = "DRAFT" | "VALIDATED" | "PROCESSED" | "LOCKED";

// --- PayslipSummaryDTO ---
export interface PayslipSummaryDTO {
    payslipId: string;
    period: string;       // "02/2026"
    netSalary: number;
    status: PayslipStatus;
    paidAt: string | null; // ISO date
}

// --- PayslipDetailDTO ---
export interface PayslipItemDTO {
    itemName: string;
    amount: number;
    type: "INCOME" | "DEDUCTION";
}

export interface PayslipDetailDTO {
    payslipId: string;
    month: number;
    year: number;
    startDate: string;
    endDate: string;
    baseSalary: number;
    totalAllowances: number;
    grossSalary: number;
    taxAmount: number;
    insuranceAmount: number;
    totalDeductions: number;
    netSalary: number;
    status: PayslipStatus;
    paidAt: string | null;
    items: PayslipItemDTO[];
}

// --- CreateInquiryRequest ---
export interface CreateInquiryRequest {
    payslipId?: string | null;
    subject: string;
    message: string;
}

// --- InquiryResponseDTO ---
export interface InquiryResponseDTO {
    id: string;
    subject: string;
    message: string;
    status: InquiryStatus;
    hrResponse: string | null;
    createdAt: string;
    resolvedAt: string | null;
    payslipId: string | null;
    payslipPeriod: string | null;
    employeeId: string | null;
    employeeName: string | null;
}

export interface CreateInquiryResponseDTO {
    inquiryId: string;
    responderId: string;
    officialResponse: string;
    internalNote?: string;
}

// --- PayrollBatchDTO ---
export interface PayrollBatchDTO {
    batchId: string;
    period: string;        // "2026-02-01"
    status: string;        // "DRAFT" | "PROCESSED" | "VALIDATED" | "LOCKED"
    createdAt: string | null;
    processedAt: string | null;
    label: string;         // from backend computed method
}

// --- PayrollReviewDTO ---
export interface PayrollReviewDTO {
    detailId: string;
    employeeId: string;
    employeeName: string;
    department: string;
    baseSalary: number;
    totalOtHours: number;
    otPay: number;
    totalAbsentDays: number;
    absentDeduction: number;
    grossSalary: number;
    hasWarning: boolean;
    warningMessage: string;
}

// --- TaxInsuranceDTO ---
export interface TaxInsuranceDTO {
    employeeId: string;
    employeeName: string;
    department: string;
    grossSalary: number;
    baseSalary: number;
    bhxh: number;
    bhyt: number;
    bhtn: number;
    totalIns: number;
    pit: number;
    totalDeduct: number;
    netSalary: number;
}

// --- UpdatePayrollDetailRequest ---
export interface UpdatePayrollDetailRequest {
    totalOtHours?: number;
    totalAbsentDays?: number;
    grossSalaryAdjustment?: number;
}

// --- Spring Boot Page<T> response ---
export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────────────────────
// Employee Payslip APIs (EmployeePayslipController)
// ──────────────────────────────────────────────────────────────────────────────

/** GET /api/v1/employee/payslips — Lịch sử lương (phân trang) */
export async function getMyPayslips(page = 0, size = 10) {
    const res = await apiClient.get<PageResponse<PayslipSummaryDTO>>(
        "/api/v1/employee/payslips",
        { params: { page, size } }
    );
    return res.data;
}

/** GET /api/v1/employee/payslips/:id — Chi tiết 1 phiếu lương */
export async function getPayslipDetail(payslipId: string) {
    const res = await apiClient.get<PayslipDetailDTO>(
        `/api/v1/employee/payslips/${payslipId}`
    );
    return res.data;
}

/** Lấy file PDF từ Server (dưới dạng BLOB binary data) */
export async function downloadPayslipPdf(payslipId: string) {
    const res = await apiClient.get(
        `/api/v1/employee/payslips/${payslipId}/pdf`,
        {
            responseType: 'blob' // Lấy dữ liệu dạng file thay vì text
        }
    );
    return res.data;
}

// ──────────────────────────────────────────────────────────────────────────────
// Employee Inquiry APIs (EmployeeInquiryController)
// ──────────────────────────────────────────────────────────────────────────────

/** POST /api/v1/employee/inquiries — Gửi thắc mắc mới */
export async function createInquiry(request: CreateInquiryRequest) {
    const res = await apiClient.post<InquiryResponseDTO>(
        "/api/v1/employee/inquiries",
        request
    );
    return res.data;
}

/** GET /api/v1/employee/inquiries — Lịch sử thắc mắc (phân trang) */
export async function getMyInquiries(page = 0, size = 10) {
    const res = await apiClient.get<PageResponse<InquiryResponseDTO>>(
        "/api/v1/employee/inquiries",
        { params: { page, size } }
    );
    return res.data;
}

/** GET /api/v1/hr/payroll/inquiries — Lấy toàn bộ danh sách thắc mắc (HR view) */
export async function getAllInquiries(page = 0, size = 20) {
    const res = await apiClient.get<PageResponse<InquiryResponseDTO>>(
        "/api/v1/hr/payroll/inquiries",
        { params: { page, size } }
    );
    return res.data;
}

/** POST /api/v1/salary-inquiries/responses — Phản hồi thắc mắc */
export async function replyInquiry(data: CreateInquiryResponseDTO) {
    const res = await apiClient.post(
        "/api/v1/salary-inquiries/responses",
        data
    );
    return res.data;
}

/** PUT /api/v1/hr/payroll/inquiries/:id/status?status=... — Cập nhật trạng thái thắc mắc */
export async function updateInquiryStatus(inquiryId: string, status: string) {
    const res = await apiClient.put<InquiryResponseDTO>(
        `/api/v1/hr/payroll/inquiries/${inquiryId}/status`,
        null,
        { params: { status } }
    );
    return res.data;
}

// ──────────────────────────────────────────────────────────────────────────────
// HR Payroll Batch Management APIs (HrPayrollController)
// ──────────────────────────────────────────────────────────────────────────────

/** GET /api/v1/hr/payroll/batches — Lấy danh sách tất cả batch, mới nhất đầu */
export async function getBatches() {
    const res = await apiClient.get<PayrollBatchDTO[]>("/api/v1/hr/payroll/batches");
    return res.data;
}

/** POST /api/v1/hr/payroll/batches — Tạo batch mới cho tháng/năm */
export async function createBatch(month: number, year: number) {
    const res = await apiClient.post<PayrollBatchDTO>("/api/v1/hr/payroll/batches", { month, year });
    return res.data;
}

/** POST /api/v1/hr/payroll/calculate/:batchId — Kích hoạt tính lương */
export async function calculatePayroll(batchId: string) {
    const res = await apiClient.post<string>(
        `/api/v1/hr/payroll/calculate/${batchId}`
    );
    return res.data;
}

// ──────────────────────────────────────────────────────────────────────────────
// HR Payroll Review APIs (PayrollReviewController)
// ──────────────────────────────────────────────────────────────────────────────

/** GET /api/v1/hr/payroll-review/:batchId — Dữ liệu review của 1 batch */
export async function getBatchDetailsForReview(batchId: string) {
    const res = await apiClient.get<PayrollReviewDTO[]>(
        `/api/v1/hr/payroll-review/${batchId}`
    );
    return res.data;
}

/** PUT /api/v1/hr/payroll-review/details/:detailId — Sửa 1 dòng lương */
export async function updatePayrollDetail(
    detailId: string,
    request: UpdatePayrollDetailRequest
) {
    const res = await apiClient.put<string>(
        `/api/v1/hr/payroll-review/details/${detailId}`,
        request
    );
    return res.data;
}

/** POST /api/v1/hr/payroll-review/:batchId/approve — Validate & Approve batch */
export async function approveBatch(batchId: string) {
    const res = await apiClient.post<string>(
        `/api/v1/hr/payroll-review/${batchId}/approve`
    );
    return res.data;
}

/** POST /api/v1/hr/payroll-review/:batchId/send-report — Gửi báo cáo */
export async function sendPayrollReport(batchId: string) {
    const res = await apiClient.post<string>(
        `/api/v1/hr/payroll-review/${batchId}/send-report`
    );
    return res.data;
}

/** POST /api/v1/hr/payroll-review/:batchId/send-tax-report — Gửi báo cáo Thuế & Bảo Hiểm */
export async function sendTaxReport(batchId: string) {
    const res = await apiClient.post<string>(
        `/api/v1/hr/payroll-review/${batchId}/send-tax-report`
    );
    return res.data;
}

/** GET /api/v1/hr/payroll-review/:batchId/tax-insurance — Dữ liệu Thuế & Bảo hiểm */
export async function getTaxInsuranceReport(batchId: string) {
    const res = await apiClient.get<TaxInsuranceDTO[]>(
        `/api/v1/hr/payroll-review/${batchId}/tax-insurance`
    );
    return res.data;
}

// ──────────────────────────────────────────────────────────────────────────────
// Finance Payment DTOs
// ──────────────────────────────────────────────────────────────────────────────

export interface PaymentRequestDTO {
    requestId: string;
    payrollBatchId: string;
    requesterId: string;
    approverId: string | null;
    totalAmountRequested: number;
    status: string;
    hrNote: string | null;
    financeNote: string | null;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface PaymentBatchHistoryDTO {
    paymentBatchId: string;
    payrollBatchId: string;
    month: number;
    year: number;
    totalAmount: number;
    totalTransactions: number;
    successTransactions: number;
    failedTransactions: number;
    status: string;
    createdAt: string | null;
    completedAt: string | null;
}

export interface PaymentTransactionHistoryDTO {
    transactionId: string;
    paymentBatchId: string;
    employeeId: string;
    employeeName: string;
    amount: number;
    bankResponseCode: string | null;
    status: string;
    createdAt: string | null;
}

export interface FinanceAccountDTO {
    accountId: string;
    accountName: string;
    bankName: string;
    accountNumber: string;
    currentBalance: number;
    status: string;
}

export interface ApprovePaymentRequest {
    requestId: string;
    sourceAccountId: string;
    bankRefCode: string;
    financeNote?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Finance Payment APIs
// ──────────────────────────────────────────────────────────────────────────────

/** GET /api/v1/finance/payment-requests — Lấy danh sách yêu cầu thanh toán */
export async function getFinanceRequests(status?: string) {
    const res = await apiClient.get<PaymentRequestDTO[]>(
        "/api/v1/finance/payment-requests",
        { params: status ? { status } : undefined }
    );
    return res.data;
}

/** POST /api/v1/finance/payment-requests/:id/approve-and-execute — Duyệt & thực hiện chi trả */
export async function approveAndExecutePayment(payload: ApprovePaymentRequest) {
    const res = await apiClient.post<string>(
        `/api/v1/finance/payment-requests/${payload.requestId}/approve-and-execute`,
        payload
    );
    return res.data;
}

/** POST /api/v1/finance/payment-requests/:id/reject — Từ chối yêu cầu */
export async function rejectPaymentRequest(requestId: string, note: string) {
    const res = await apiClient.post<string>(
        `/api/v1/finance/payment-requests/${requestId}/reject`,
        { financeNote: note }
    );
    return res.data;
}

/** GET /api/v1/finance/payment-batches — Lịch sử batch thanh toán */
export async function getPaymentBatches(page = 0, size = 50) {
    const res = await apiClient.get<PageResponse<PaymentBatchHistoryDTO>>(
        "/api/v1/finance/payment-batches",
        { params: { page, size } }
    );
    return res.data;
}

/** GET /api/v1/finance/payment-batches/:id/transactions — Giao dịch chi tiết của 1 batch */
export async function getPaymentTransactions(paymentBatchId: string) {
    const res = await apiClient.get<PageResponse<PaymentTransactionHistoryDTO>>(
        `/api/v1/finance/payment-batches/${paymentBatchId}/transactions`
    );
    return res.data;
}
