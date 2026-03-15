# Payroll Module - Complete Structure Analysis

**Workspace:** d:\Java\SWP391-SP26  
**Last Updated:** March 10, 2026

---

## Table of Contents
1. [Backend Java Files](#backend-java-files)
2. [Frontend Components](#frontend-components)
3. [Frontend Services](#frontend-services)
4. [Data Types & Models](#data-types--models)

---

## BACKEND JAVA FILES

### Location: `backend/src/main/java/com/project/hrm/module/payroll/`

---

## 1. CONTROLLER LAYER (`controller/`)

### 1.1 EmployeePayslipController.java
**Path:** `backend/.../payroll/controller/EmployeePayslipController.java`  
**Purpose:** REST API for employee payslip operations (view history, download PDF)

**Key Methods:**
- `getMyPayslips(Pageable pageable)` → GET `/api/v1/employee/payslips`
  - Returns paginated list of payslips for current employee
  - Returns: `Page<PayslipSummaryDTO>`
- `getPayslipDetail(UUID id)` → GET `/api/v1/employee/payslips/{id}`
  - Returns detailed payslip with breakdown items
  - Returns: `PayslipDetailDTO`
- `downloadPayslipPdf(UUID id)` → GET `/api/v1/employee/payslips/{id}/pdf`
  - Generates and downloads payslip as PDF
  - Returns: PDF binary data (byte[])

**Dependencies:**
- `EmployeePayslipService` - Business logic
- `EmployeePayslipPdfService` - PDF generation
- `EmployeeRepository` - Employee lookup
- `SecurityContextHolder` - Current user authentication

**Authentication:** Required (JWT via SecurityContext)

---

### 1.2 EmployeeInquiryController.java
**Path:** `backend/.../payroll/controller/EmployeeInquiryController.java`  
**Purpose:** REST API for employee payroll inquiries (questions/support)

**Key Methods:**
- `createInquiry(CreateInquiryRequest)` → POST `/api/v1/employee/inquiries`
  - Submit payroll-related inquiry
  - Accepts: subject, message, optional payslipId
  - Returns: `InquiryResponseDTO`
- `getMyInquiries(Pageable)` → GET `/api/v1/employee/inquiries`
  - Get inquiry history with pagination
  - Returns: `Page<InquiryResponseDTO>`

**Dependencies:**
- `EmployeeInquiryService` - Business logic

---

### 1.3 HrPayrollController.java
**Path:** `backend/.../payroll/controller/HrPayrollController.java`  
**Purpose:** REST API for HR payroll batch management and inquiry handling

**Key Methods:**
- `getAllInquiries(Pageable)` → GET `/api/v1/hr/payroll/inquiries`
  - List all employee inquiries (HR view)
  - Returns: `Page<InquiryResponseDTO>`
- `updateInquiryStatus(UUID, InquiryStatus)` → PUT `/api/v1/hr/payroll/inquiries/{id}/status`
  - Update inquiry status (OPEN → IN_PROGRESS → RESOLVED/REJECTED)
  - Returns: `InquiryResponseDTO`
- `getAllBatches()` → GET `/api/v1/hr/payroll/batches`
  - List all payroll batches, newest first
  - Returns: `List<PayrollBatchDTO>`
- `createBatch(Map<String, Integer>)` → POST `/api/v1/hr/payroll/batches`
  - Create new batch for specified month/year
  - Body: `{"month": 2, "year": 2026}`
  - Returns: `PayrollBatchDTO`

**Dependencies:**
- `PayrollCalculationService` - Payroll calculations
- `PayrollBatchRepository` - Batch CRUD
- `EmployeeInquiryService` - Inquiry management

---

### 1.4 PayrollReviewController.java
**Path:** `backend/.../payroll/controller/PayrollReviewController.java`  
**Purpose:** REST API for HR review, validation, and approval of payroll

**Key Methods:**
- `getBatchDetails(UUID)` → GET `/api/v1/hr/payroll-review/{batchId}`
  - Get detailed payroll lines for review (per employee)
  - Returns: `List<PayrollReviewDTO>`
- `updateDetail(UUID, UpdatePayrollDetailRequest)` → PUT `/api/v1/hr/payroll-review/details/{detailId}`
  - Manually adjust OT hours, absent days, salary
  - Returns: "Updated successfully"
- `approveBatch(UUID)` → POST `/api/v1/hr/payroll-review/{batchId}/approve`
  - Validate & approve batch (PROCESSED → VALIDATED)
  - Returns: "Batch validated and approved successfully"
- `sendReport(UUID)` → POST `/api/v1/hr/payroll-review/{batchId}/send-report`
  - Lock batch and send to Finance (VALIDATED → LOCKED)
  - Returns: "Report sent successfully and batch is locked"
- `sendTaxReport(UUID)` → POST `/api/v1/hr/payroll-review/{batchId}/send-tax-report`
  - Send tax/insurance report to Finance dept
  - Returns: "Tax & Insurance Report sent successfully"
- `getTaxAndInsuranceReport(UUID)` → GET `/api/v1/hr/payroll-review/{batchId}/tax-insurance`
  - Get tax/insurance breakdown per employee
  - Returns: `List<TaxInsuranceDTO>`

**Dependencies:**
- `PayrollReviewService` - Review/approval logic

---

### 1.5 FinanceController.java
**Path:** `backend/.../payroll/controller/FinanceController.java`  
**Purpose:** REST API for Finance payment processing and fund management

**Key Methods:**
- `getPaymentRequests(String status)` → GET `/api/v1/finance/payment-requests`
  - List payment requests, optionally filtered by status
  - Returns: `List<PaymentRequest>`
- `approveAndExecutePayment(UUID, ApprovalResponseDTO)` → POST `/api/v1/finance/payment-requests/{id}/approve-and-execute`
  - Approve and process payment (transfer funds, update status)
  - Body: sourceAccountId, bankRefCode, financeNote
  - Returns: Success message
- `rejectPaymentRequest(UUID, Map)` → POST `/api/v1/finance/payment-requests/{id}/reject`
  - Reject payment request with note
  - Returns: Success message
- `getPaymentBatches(Pageable)` → GET `/api/v1/finance/payment-batches`
  - Payment batch history with pagination
  - Returns: `Page<PaymentBatchHistoryDTO>`
- `getPaymentTransactions(UUID, Pageable)` → GET `/api/v1/finance/payment-batches/{id}/transactions`
  - List individual transactions in batch
  - Returns: `Page<PaymentTransactionHistoryDTO>`
- `getFinanceAccounts()` → GET `/api/v1/finance/accounts`
  - List available finance accounts (fund sources)
  - Returns: `List<FinanceAccountDTO>`

**Dependencies:**
- `FinanceService` - Finance operations

---

### 1.6 PayrollReviewController.java (SalaryInquiryResponseController)
**Path:** `backend/.../payroll/controller/SalaryInquiryResponseController.java`  
**Purpose:** HR response to employee payroll inquiries

**Note:** Endpoint: POST `/api/v1/salary-inquiries/responses`

---

## 2. SERVICE LAYER (`service/`)

### 2.1 PayrollCalculationService.java
**Path:** `backend/.../payroll/service/PayrollCalculationService.java`  
**Purpose:** Core payroll calculation engine

**Key Methods:**
- `calculatePayrollForBatch(UUID batchId)` → ⭐ MAIN CALCULATION
  - **Process:**
    1. Retrieve batch & validate status (not LOCKED)
    2. Load attendance data for period
    3. Iterate through all employees
    4. For each employee:
       - Find active salary profile
       - Load attendance (OT hours, absent days)
       - Calculate base salary & allowances
       - Calculate deductions (tax, insurance)
       - Calculate net salary
       - Create Payslip & PayslipDetail records
  - **Returns:** void (saves to DB)
  - **Transactional:** Yes (rollback on error)

**Calculation Logic:**
```
Standard Days = 22 (or 20/21 for February per leap year)
Base Salary = Profile.baseSalary
Allowances = Sum of Profile.allowances (JSONB map)
Gross Salary = Base + Allowances
Tax = calculated via TaxConfig
Insurance = calculated via InsuranceConfig
Total Deductions = Tax + Insurance
Net Salary = Gross - Deductions
```

**Dependencies:**
- `PayrollBatchRepository` - Batch lookup
- `AttendanceLogRepository` - Attendance aggregation
- `SalaryProfileRepository` - Salary data
- `PayrollDetailRepository` - Detail persistence
- `EmployeeRepository` - Employee lookup
- `PayslipRepository` - Payslip persistence
- `PayrollPeriodRepository` - Period lookup
- `PerformanceReviewsRepository` - Performance data

---

### 2.2 EmployeePayslipService.java
**Path:** `backend/.../payroll/service/EmployeePayslipService.java`  
**Purpose:** Employee payslip retrieval and formatting

**Key Methods:**
- `getMyPayslips(UUID employeeId, Pageable)` → Get employee's payslip history
  - Uses native query with status filtering (DRAFT, CONFIRMED, PAID)
  - Returns: `Page<PayslipSummaryDTO>`
- `getPayslipDetail(UUID employeeId, UUID payslipId)` → Get single payslip detail
  - Validates employee access (security check)
  - Maps Payslip entity to DTO with items breakdown
  - Returns: `PayslipDetailDTO`

**DTO Mapping:**
- Payslip → PayslipSummaryDTO (period, netSalary, status, paidAt)
- Payslip + PayslipDetails → PayslipDetailDTO (breakdown items)

**Dependencies:**
- `PayslipRepository` - Payslip data access
- `EntityManager` - JPA operations

---

### 2.3 EmployeePayslipPdfService.java
**Path:** `backend/.../payroll/service/EmployeePayslipPdfService.java`  
**Purpose:** PDF generation for payslips

**Key Methods:**
- `generatePayslipPdf(PayslipDetailDTO, String employeeName)` → byte[]
  - Generates professional PDF document with:
    - Employee info
    - Period (month/year)
    - Salary breakdown (gross, deductions, net)
    - Tax & insurance details
    - Item-by-item breakdown
  - Returns: PDF bytes

---

### 2.4 PayrollReviewService.java
**Path:** `backend/.../payroll/service/PayrollReviewService.java`  
**Purpose:** HR review, validation, and approval workflows

**Key Methods:**
- `getBatchDetailsForReview(UUID batchId)` → `List<PayrollReviewDTO>`
  - Get all payroll lines for batch
  - Includes calculated flags (hasWarning)
- `updatePayrollDetail(UUID detailId, UpdatePayrollDetailRequest)` → void
  - Allow HR to manually adjust OT hours, absent days, salary adjustments
  - Recalculates gross/net
- `validateAndApproveBatch(UUID batchId)` → void
  - Validate batch integrity
  - Change status PROCESSED → VALIDATED
  - Prevent future recalculation
- `sendReport(UUID batchId)` → void
  - Lock batch (VALIDATED → LOCKED)
  - Generate payslips (if not already done)
  - Prevent further modifications
- `sendTaxReport(UUID batchId)` → void
  - Extract tax/insurance data
  - Create payment request to Finance
- `getTaxAndInsuranceReport(UUID batchId)` → `List<TaxInsuranceDTO>`
  - Breakdown per employee: BHXH, BHYT, BHTN, PIT

**Dependencies:**
- `PayrollBatchRepository`
- `PayrollDetailRepository`
- `PayslipRepository`
- `TaxConfigRepository`
- `InsuranceConfigRepository`
- `EmployeeRepository`
- `PaymentRequestRepository` (for finance requests)

---

### 2.5 EmployeeInquiryService.java
**Path:** `backend/.../payroll/service/EmployeeInquiryService.java`  
**Purpose:** Inquiry/ticket management for payroll questions

**Key Methods:**
- `createInquiry(CreateInquiryRequest, UUID employeeId)` → `InquiryResponseDTO`
  - Create support ticket
  - Status: OPEN
- `getMyInquiries(UUID employeeId, Pageable)` → `Page<InquiryResponseDTO>`
  - Employee's inquiry history
- `getAllInquiries(Pageable)` → `Page<InquiryResponseDTO>` (HR view)
- `updateInquiryStatus(UUID inquiryId, InquiryStatus)` → `InquiryResponseDTO`
  - OPEN → IN_PROGRESS, RESOLVED, REJECTED
- `replyToInquiry(CreateInquiryResponseDTO)` → void
  - HR response to inquiry

**Dependencies:**
- `SalaryInquiryRepository`
- `SalaryInquiryResponseRepository`

---

### 2.6 FinanceService.java
**Path:** `backend/.../payroll/service/FinanceService.java`  
**Purpose:** Payment processing and fund management

**Key Methods:**
- `createPaymentRequest(PaymentRequestDTO)` → `PaymentRequest`
  - HR creates request for payroll payment
- `getPendingRequests()` → `List<PaymentRequest>`
  - Finance views pending approvals
- `approveAndExecutePayment(ApprovalResponseDTO)` → String
  - **Process:**
    1. Verify request status = PENDING
    2. Validate source account exists
    3. Check sufficient balance
    4. Deduct from account
    5. Create transaction records
    6. Update request status → APPROVED/PAID
  - Returns: Confirmation message
- `rejectPaymentRequest(UUID, String)` → void
  - Reject with note
- `getPaymentBatches(Pageable)` → `Page<PaymentBatchHistoryDTO>`
  - Payment batch history
- `getPaymentTransactions(UUID, Pageable)` → `Page<PaymentTransactionHistoryDTO>`
  - Each employee transaction in batch
- `getAllAccounts()` → `List<FinanceAccountDTO>`
  - Available bank accounts for fund source

**Dependencies:**
- `FinanceAccountRepository`
- `PaymentRequestRepository`
- `FinancialTransactionRepository`
- `PaymentBatchRepository`
- `PaymentTransactionRepository`

---

### 2.7 PayrollReviewService.java (Additional)
**Path:** `backend/.../payroll/service/SalaryInquiryResponseService.java`  
**Purpose:** HR response handling for inquiry service

---

## 3. ENTITY LAYER (`entity/`)

### 3.1 Payslip.java
**Purpose:** Employee payslip master record

**Fields:**
```
payslipId: UUID (PK)
employee: Employee (FK) - Many-to-One
payrollPeriod: PayrollPeriod (FK) - Many-to-One
baseSalary: BigDecimal
totalAllowances: BigDecimal
grossSalary: BigDecimal
taxAmount: BigDecimal
insuranceAmount: BigDecimal
totalDeductions: BigDecimal
netSalary: BigDecimal
status: PayslipStatus (ENUM) - DRAFT, CONFIRMED, PAID, CANCELLED
createdAt: LocalDateTime
confirmedAt: LocalDateTime
paidAt: LocalDateTime
details: List<PayslipDetail> (One-to-Many)
```

**Table:** `payslips`  
**Database Type:** PostgreSQL with custom enum `payslip_status`

---

### 3.2 PayslipDetail.java
**Purpose:** Line items in payslip (allowances, deductions, bonuses)

**Fields:**
```
detailId: UUID (PK)
payslip: Payslip (FK) - Many-to-One
itemName: String (e.g., "Overtime Pay", "Health Insurance")
amount: BigDecimal
type: Integer (1 = INCOME, 2 = DEDUCTION)
```

**Table:** `payslip_details`

---

### 3.3 PayrollBatch.java
**Purpose:** Monthly payroll batch container

**Fields:**
```
batchId: UUID (PK)
period: LocalDate (first day of month)
status: BatchStatus (ENUM) - DRAFT, VALIDATED, PROCESSED, LOCKED
createdAt: LocalDateTime
processedAt: LocalDateTime
lockedAt: LocalDateTime
```

**Status Workflow:**
```
DRAFT → PROCESSED (after calculation) → VALIDATED (after HR review) → LOCKED (after sending to Finance)
```

**Table:** `payroll_batches`

---

### 3.4 PayrollDetail.java
**Purpose:** Payroll line for each employee in batch (intermediate)

**Fields:**
```
payrollId: UUID (PK)
payrollBatch: PayrollBatch (FK)
employee: Employee (FK)
baseSalary: BigDecimal
totalOtHours: BigDecimal (overtime hours)
totalAbsentDays: BigDecimal
otPay: BigDecimal (calculated)
absentDeduction: BigDecimal (calculated)
grossSalary: BigDecimal (calculated)
netSalary: BigDecimal (calculated)
createdAt: LocalDateTime
```

**Table:** `payroll_details`

---

### 3.5 PayrollPeriod.java
**Purpose:** Reference period for all payroll transactions

**Fields:**
```
periodId: UUID (PK)
month: Integer (1-12)
year: Integer
startDate: LocalDate (first day)
endDate: LocalDate (last day)
status: PayrollStatus (OPEN, CLOSED, LOCKED)
createdAt: LocalDateTime
```

**Table:** `payroll_periods`

---

### 3.6 SalaryProfile.java
**Purpose:** Employee salary configuration

**Fields:**
```
profileId: UUID (PK)
employee: Employee (FK)
baseSalary: BigDecimal
allowances: Map<String, Object> (JSONB - flexible allowances)
  Example: {"housing": 500000, "transport": 200000}
taxConfig: TaxConfig (FK)
insuranceCode: String (reference to InsuranceConfig)
effectiveFrom: LocalDate
effectiveTo: LocalDate (nullable - NULL = active)
createdAt: LocalDateTime
updatedAt: LocalDateTime
```

**Table:** `salary_profiles`  
**Note:** Allows multiple effective periods for salary history

---

### 3.7 TaxConfig.java
**Purpose:** Tax calculation rules

**Fields:**
```
taxCode: String (PK)
taxRate: BigDecimal (e.g., 0.05 for 5%)
description: String
status: String (ACTIVE, INACTIVE)
```

**Table:** `tax_configs`

---

### 3.8 InsuranceConfig.java
**Purpose:** Insurance (BHXH, BHYT, BHTN) configuration

**Fields:**
```
insuranceCode: String (PK)
bhxhRate: BigDecimal (Social: 8% employee)
bhytRate: BigDecimal (Health: ~3%)
bhtnRate: BigDecimal (Unemployment: ~1%)
employerBhxhRate: BigDecimal (Employer contribution)
status: String (ACTIVE, INACTIVE)
```

**Table:** `insurance_configs`

---

### 3.9 PaymentRequest.java
**Purpose:** Request to Finance to process payments

**Fields:**
```
requestId: UUID (PK)
payrollBatchId: UUID
requesterId: UUID (HR who requested)
approverId: UUID (nullable - Finance who approved)
totalAmountRequested: BigDecimal
reportUrl: String (link to payroll report)
status: String (PENDING, APPROVED, REJECTED, PAID)
hrNote: String
financeNote: String
createdAt: LocalDateTime
updatedAt: LocalDateTime
```

**Table:** `payment_requests`

---

### 3.10 PaymentBatch.java
**Purpose:** Batch of actual payments processed

**Fields:**
```
paymentBatchId: UUID (PK)
payrollBatchId: UUID (reference back)
month: Integer
year: Integer
totalAmount: BigDecimal
totalTransactions: Integer
successTransactions: Integer
failedTransactions: Integer
status: String (PROCESSING, COMPLETED, FAILED)
createdAt: LocalDateTime
completedAt: LocalDateTime
```

**Table:** `payment_batches`

---

### 3.11 PaymentTransaction.java
**Purpose:** Individual fund transfer record

**Fields:**
```
transactionId: UUID (PK)
paymentBatchId: UUID (FK)
employeeId: UUID
bankRefCode: String (bank reference)
amount: BigDecimal
status: TransactionStatus (SUCCESS, FAILED, PENDING)
createdAt: LocalDateTime
```

**Table:** `payment_transactions`

---

### 3.12 FinanceAccount.java
**Purpose:** Bank accounts for fund source

**Fields:**
```
accountId: UUID (PK)
accountName: String
bankName: String
accountNumber: String (masked)
currentBalance: BigDecimal
status: String (ACTIVE, INACTIVE)
```

**Table:** `finance_accounts`

---

### 3.13 FinancialTransaction.java
**Purpose:** General ledger transactions

**Fields:**
```
id: UUID (PK)
financeAccountId: UUID (FK)
transactionType: String (DEBIT, CREDIT)
amount: BigDecimal
description: String
reference: String (reference to PaymentBatch, etc)
createdAt: LocalDateTime
```

**Table:** `financial_transactions`

---

### 3.14 SalaryInquiry.java
**Purpose:** Employee question/ticket about payroll

**Fields:**
```
inquiryId: UUID (PK)
employeeId: UUID (FK)
payslipId: UUID (nullable - reference payslip if about specific one)
subject: String
message: String
status: InquiryStatus (OPEN, IN_PROGRESS, RESOLVED, REJECTED)
createdAt: LocalDateTime
```

**Table:** `salary_inquiries`

---

### 3.15 SalaryInquiryResponse.java
**Purpose:** HR response to inquiry

**Fields:**
```
responseId: UUID (PK)
inquiryId: UUID (FK) - Many-to-One with SalaryInquiry
responderId: UUID (HR staff)
officialResponse: String
internalNote: String (nullable)
createdAt: LocalDateTime
```

**Table:** `salary_inquiry_responses`

---

## 4. REPOSITORY LAYER (`repository/`)

**All repositories extend `JpaRepository<Entity, UUID>` or `PagingAndSortingRepository`**

### Repositories (List):
1. **PayslipRepository.java**
   - `findByIdAndEmployeeId(UUID, UUID)` → Payslip
   - `findPayslipsWithPeriod(UUID employeeId, List status, Pageable)` → Page<Payslip>
   - `deleteByPayrollPeriod_PeriodId(UUID)` → void

2. **PayrollBatchRepository.java**
   - Standard CRUD operations for PayrollBatch

3. **PayrollDetailRepository.java**
   - Find by batch, employee, period
   - `findByPayrollBatch_BatchId(UUID)` → List<PayrollDetail>

4. **PayrollPeriodRepository.java**
   - `findByMonthAndYear(int, int)` → Optional<PayrollPeriod>
   - `findByStatus(PayrollStatus)` → List<PayrollPeriod>

5. **SalaryProfileRepository.java**
   - `findActiveProfileForPeriod(UUID employeeId, LocalDate start, LocalDate end)` → Optional<SalaryProfile>
   - `findByEmployee_EmployeeId(UUID)` → List<SalaryProfile>

6. **TaxConfigRepository.java**
   - Custom tax configuration queries

7. **InsuranceConfigRepository.java**
   - Custom insurance configuration queries

8. **PaymentRequestRepository.java**
   - `findByStatusOrderByCreatedAtDesc(String status)` → List<PaymentRequest>
   - `findByPayrollBatchId(UUID)` → List<PaymentRequest>

9. **PaymentBatchRepository.java**
   - Payment batch history queries

10. **PaymentTransactionRepository.java**
    - `findByPaymentBatchId(UUID)` → List<PaymentTransaction>

11. **FinanceAccountRepository.java**
    - `findByStatusOrderByCreatedAt(String)` → List<FinanceAccount>

12. **FinancialTransactionRepository.java**
    - Ledger transaction queries

13. **SalaryInquiryRepository.java**
    - `findByEmployeeId(UUID, Pageable)` → Page<SalaryInquiry>
    - `findByStatus(InquiryStatus, Pageable)` → Page<SalaryInquiry>

14. **SalaryInquiryResponseRepository.java**
    - Inquiry response queries

15. **PayslipDetailRepository.java** (for Details)
    - `findByPayslip_PayslipId(UUID)` → List<PayslipDetail>

16. **AttendanceLogRepository.java** (from attendance module)
    - `aggregateAttendanceByPeriod(LocalDate, LocalDate)` → List<AttendanceAggregationDTO>

17. **PerformanceReviewsRepository.java** (from evaluation module)
    - Performance bonus queries

---

## 5. DTO LAYER (`dto/`)

### Request DTOs (`RequestDTO/`)

1. **PayrollBatchDTO.java**
   ```
   batchId: UUID
   period: LocalDate
   status: String
   createdAt: LocalDateTime
   processedAt: LocalDateTime
   ```

2. **PayrollReviewDTO.java**
   ```
   detailId: UUID
   employeeId: UUID
   employeeName: String
   department: String
   baseSalary: BigDecimal
   totalOtHours: BigDecimal
   otPay: BigDecimal
   totalAbsentDays: BigDecimal
   absentDeduction: BigDecimal
   grossSalary: BigDecimal
   hasWarning: Boolean
   warningMessage: String
   ```

3. **CreateInquiryRequest.java**
   ```
   payslipId?: UUID
   subject: String
   message: String
   ```

4. **UpdatePayrollDetailRequest.java**
   ```
   totalOtHours?: BigDecimal
   totalAbsentDays?: BigDecimal
   grossSalaryAdjustment?: BigDecimal
   ```

5. **PaymentRequestDTO.java**
   ```
   payrollBatchId: UUID
   requesterId: UUID
   totalAmountRequested: BigDecimal
   reportUrl: String
   hrNote: String
   ```

6. **PaymentExecutionDTO.java**
   ```
   requestId: UUID
   sourceAccountId: UUID
   bankRefCode: String
   financeNote?: String
   ```

7. **FinanceRequestDecisionDTO.java**
   ```
   requestId: UUID
   decision: String (APPROVE, REJECT)
   note: String
   ```

---

### Response DTOs (`ResponseDTO/`)

1. **PayslipSummaryDTO.java**
   ```
   payslipId: UUID
   period: String (e.g., "02/2026")
   netSalary: BigDecimal
   status: PayslipStatus
   paidAt: LocalDate?
   ```

2. **PayslipDetailDTO.java**
   ```
   payslipId: UUID
   month: Integer
   year: Integer
   startDate: LocalDate
   endDate: LocalDate
   baseSalary: BigDecimal
   totalAllowances: BigDecimal
   grossSalary: BigDecimal
   taxAmount: BigDecimal
   insuranceAmount: BigDecimal
   totalDeductions: BigDecimal
   netSalary: BigDecimal
   status: PayslipStatus
   paidAt: LocalDate?
   items: List<PayslipItemDTO>
     {itemName, amount, type: INCOME|DEDUCTION}
   ```

3. **InquiryResponseDTO.java**
   ```
   id: UUID
   subject: String
   message: String
   status: InquiryStatus
   hrResponse: String?
   createdAt: LocalDateTime
   resolvedAt: LocalDateTime?
   payslipId: UUID?
   payslipPeriod: String?
   employeeId: UUID?
   employeeName: String?
   ```

4. **CreateInquiryResponseDTO.java**
   ```
   inquiryId: UUID
   responderId: UUID
   officialResponse: String
   internalNote?: String
   ```

5. **TaxInsuranceDTO.java**
   ```
   employeeId: UUID
   employeeName: String
   department: String
   grossSalary: BigDecimal
   baseSalary: BigDecimal
   bhxh: BigDecimal (Social insurance 8%)
   bhyt: BigDecimal (Health)
   bhtn: BigDecimal (Unemployment)
   totalIns: BigDecimal
   pit: BigDecimal (Personal income tax)
   totalDeduct: BigDecimal (total deductions)
   netSalary: BigDecimal
   ```

6. **PaymentBatchHistoryDTO.java**
   ```
   paymentBatchId: UUID
   payrollBatchId: UUID
   month: Integer
   year: Integer
   totalAmount: BigDecimal
   totalTransactions: Integer
   successTransactions: Integer
   failedTransactions: Integer
   status: String
   createdAt: LocalDateTime?
   completedAt: LocalDateTime?
   ```

7. **PaymentTransactionHistoryDTO.java**
   ```
   transactionId: UUID
   paymentBatchId: UUID
   employeeId: UUID
   employeeName: String
   amount: BigDecimal
   bankResponseCode: String?
   status: String
   createdAt: LocalDateTime?
   ```

8. **ApprovalResponseDTO.java**
   ```
   requestId: UUID
   sourceAccountId: UUID
   bankRefCode: String
   financeNote?: String
   ```

9. **FinanceAccountDTO.java**
   ```
   accountId: UUID
   accountName: String
   bankName: String
   accountNumber: String
   currentBalance: BigDecimal
   status: String
   ```

---

## 6. ENUMS (`enums/`)

1. **PayslipStatus.java**
   ```
   enum: DRAFT, CONFIRMED, PAID, CANCELLED
   ```

2. **BatchStatus.java**
   ```
   enum: DRAFT, VALIDATED, PROCESSED, LOCKED
   ```

3. **PayrollStatus.java**
   ```
   enum: OPEN, CLOSED, LOCKED
   ```

4. **InquiryStatus.java**
   ```
   enum: OPEN, IN_PROGRESS, RESOLVED, REJECTED
   ```

5. **PaymentBatchStatus.java**
   ```
   enum: PROCESSING, COMPLETED, FAILED
   ```

6. **PaymentRequestStatus.java**
   ```
   enum: PENDING, APPROVED, REJECTED, PAID
   ```

7. **TransactionStatus.java**
   ```
   enum: SUCCESS, FAILED, PENDING
   ```

8. **PaymentDetailStatus.java**
   - Additional payment detail status enum

9. **RequestStatus.java**
   - Request-level status tracking

---

## FRONTEND COMPONENTS & SERVICES

### Location: `frontend/src/`

---

## 1. PAYROLL COMPONENTS (`src/components/payroll/`)

### 1.1 PayrollModule.tsx
**Purpose:** Main payroll module entry point, shared utilities, and header

**Exports:**
- `PayrollHeader` component - Shared header with tab toggle (Employee/HR/Finance)
- `fmt()` - Currency formatter (VND)
- `getErrMsg()` - Error message extractor
- `Badge` - Status badge component
- `Icon` - SVG icon/symbol definitions and exports

**Icons Available:**
- layers, user, users, wallet, money, download, print, help, refresh, check
- checkCircle, search, edit, close, chevronDown, warning, inbox, calendar, shield, trendUp

**Key Props (PayrollHeader):**
```typescript
interface PayrollHeaderProps {
  title: string;
  subtitle: string;
  activeTab: "employee" | "hr" | "finance";
}
```

---

### 1.2 EmployeePayrollView.tsx
**Purpose:** Employee payslip history and inquiry interface

**Features:**
- View payslip history (paginated)
- View payslip details with breakdown
- Download payslip as PDF
- Create payroll inquiry
- View inquiry history
- Status trackers for payslips and inquiries

**Main State:**
- `list: PayslipSummaryDTO[]` - Payslip list
- `selId: UUID | null` - Selected payslip ID
- `detail: PayslipDetailDTO | null` - Detailed view
- `inquiries: InquiryResponseDTO[]` - Inquiry list
- `tab: "payslip" | "inquiries"` - Active tab

**Sub-components:**
- `InquiryModal` - Create/submit inquiry form
- `Skeleton` - Loading state placeholder

**Key Methods:**
- `loadList()` - Fetch payslips from API
- `loadInquiries()` - Fetch inquiry history
- `loadDetail()` - Fetch single payslip detail
- `handlePdfDownload()` - Download PDF
- `handleCreateInquiry()` - Submit new inquiry

**Status Configs:**
```typescript
PAYSLIP_STATUS = {
  DRAFT, CONFIRMED, PAID, CANCELLED
}
INQUIRY_STATUS = {
  OPEN, IN_PROGRESS, RESOLVED, REJECTED
}
```

---

### 1.3 HRPayrollView.tsx
**Purpose:** HR payroll batch creation, calculation, review, and approval

**Features:**
- Create new payroll batch (month/year)
- Calculate payroll (trigger calculation service)
- Review payroll details per employee
- Update payroll items (OT, absent days)
- Approve batch (validate)
- Send report (lock batch)
- Send tax/insurance report
- Manage employee inquiries

**Main State:**
- `batches: PayrollBatchDTO[]` - All batches
- `selectedBatch: UUID | null` - Selected batch
- `details: PayrollReviewDTO[]` - Batch details for review
- `inquiries: InquiryResponseDTO[]` - All inquiries
- `activeTab` - Current view tab

**Sub-components:**
- `BatchBadge` - Batch status display
- `HRInquiriesModal` - Manage inquiries modal
- `SkeletonRows` - Loading state

**Key Methods:**
- `handleCreateBatch()` - Create new batch
- `handleCalculate()` - Trigger payroll calculation
- `handleUpdateDetail()` - Manual adjust OT/absent
- `handleApproveBatch()` - Validate & approve
- `handleSendReport()` - Lock & send to Finance
- `handleSendTaxReport()` - Send tax/insurance data

**Batch Status Workflow:**
```
DRAFT → PROCESSED (calculate) → VALIDATED (approve) → LOCKED (send)
```

---

### 1.4 FinancePayrollView.tsx
**Purpose:** Finance payment request processing and fund management

**Features:**
- View pending payment requests
- Approve/execute payments (with bank account selection)
- Reject payment requests
- View payment batch history
- View individual transaction details
- Select source Finance Account (fund transfer)

**Main State:**
- `requests: PaymentRequestDTO[]` - Pending requests
- `accounts: FinanceAccountDTO[]` - Available accounts
- `batches: PaymentBatchHistoryDTO[]` - Payment history
- `transactions: PaymentTransactionHistoryDTO[]` - Detail transactions

**Sub-components:**
- `ApproveModal` - Payment approval form with account/bank ref
- Status badges for request/batch/transaction states

**Key Methods:**
- `loadRequests()` - Fetch pending payments
- `loadAccounts()` - Fetch available finance accounts
- `handleApprove()` - Approve & execute payment
- `handleReject()` - Reject request
- `loadBatchHistory()` - Fetch payment batches
- `loadTransactions()` - Get transaction details

**Status Configs:**
```typescript
REQUEST_STATUS = { PENDING, APPROVED, PAID, REJECTED }
BATCH_STATUS_CFG = { PROCESSING, COMPLETED, FAILED }
TXN_STATUS_CFG = { SUCCESS, FAILED, PENDING }
```

---

### 1.5 TaxInsuranceReport.tsx
**Purpose:** Generate and send tax/insurance report to Finance dept

**Features:**
- Select payroll batch
- Generate tax/insurance breakdown per employee
- Confirmation modal before send
- Track report transmission

**Data Shown:**
- Employee name, department
- Gross salary, base salary
- Tax (PIT), Insurance (BHXH, BHYT, BHTN)
- Totals and net summary
- Period information

**Sub-components:**
- `ConfirmModal` - Preview & confirm report send
- Status display and report summary

**Key Methods:**
- `loadBatches()` - Get available batches
- `loadTaxInsuranceData()` - Generate breakdown
- `handleSendReport()` - Submit to Finance

---

## 2. PAYROLL SERVICES (`src/services/`)

### 2.1 payrollService.ts
**Purpose:** Frontend API client for all payroll endpoints

**Exports (Type Definitions):**

```typescript
// Enums
PayslipStatus = "DRAFT" | "CONFIRMED" | "PAID" | "CANCELLED"
InquiryStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "REJECTED"
BatchStatus = "DRAFT" | "VALIDATED" | "PROCESSED" | "LOCKED"

// DTO Interfaces
PayslipSummaryDTO
PayslipDetailDTO + PayslipItemDTO
CreateInquiryRequest
InquiryResponseDTO
CreateInquiryResponseDTO
PayrollBatchDTO
PayrollReviewDTO
TaxInsuranceDTO
UpdatePayrollDetailRequest
PageResponse<T>
PaymentRequestDTO
PaymentBatchHistoryDTO
PaymentTransactionHistoryDTO
FinanceAccountDTO
ApprovePaymentRequest
```

**API Functions:**

#### Employee Payslip APIs
- `getMyPayslips(page, size)` → `PageResponse<PayslipSummaryDTO>`
- `getPayslipDetail(payslipId)` → `PayslipDetailDTO`
- `downloadPayslipPdf(payslipId)` → `blob` (PDF binary)

#### Employee Inquiry APIs
- `createInquiry(request)` → `InquiryResponseDTO`
- `getMyInquiries(page, size)` → `PageResponse<InquiryResponseDTO>`

#### HR Payroll Batch APIs
- `getBatches()` → `PayrollBatchDTO[]`
- `createBatch(month, year)` → `PayrollBatchDTO`
- `calculatePayroll(batchId)` → `string` (result message)

#### HR Payroll Review APIs
- `getBatchDetailsForReview(batchId)` → `PayrollReviewDTO[]`
- `updatePayrollDetail(detailId, request)` → `string`
- `approveBatch(batchId)` → `string`
- `sendPayrollReport(batchId)` → `string`
- `sendTaxReport(batchId)` → `string`
- `getTaxInsuranceReport(batchId)` → `TaxInsuranceDTO[]`

#### HR Inquiry Management APIs
- `getAllInquiries(page, size)` → `PageResponse<InquiryResponseDTO>`
- `replyInquiry(data)` → void
- `updateInquiryStatus(inquiryId, status)` → `InquiryResponseDTO`

#### Finance Payment APIs
- `getFinanceRequests(status?)` → `PaymentRequestDTO[]`
- `approveAndExecutePayment(payload)` → `string`
- `rejectPaymentRequest(requestId, note)` → `string`
- `getPaymentBatches(page, size)` → `PageResponse<PaymentBatchHistoryDTO>`
- `getPaymentTransactions(paymentBatchId)` → `PageResponse<PaymentTransactionHistoryDTO>`

**Base URL:** All endpoints use `apiClient` configured with `/api/v1/` prefix

---

## 3. TYPE DEFINITIONS (`src/types.ts`)

**Payroll-Related Interfaces:**

```typescript
export interface Employee {
  id: string;
  employeeCode: string;
  avatarUrl: string;
  fullName: string;
  phone: string;
  positionTitle: string;
  role: string;
  deptName: string;
  statusRole: string;
}

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

export interface OffboardingEmployee {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  departmentName: string;
  positionTitle: string;
  employeeStatus: "TERMINATED" | "RESIGNED";
  dateOfJoining: string;
}
```

---

## DATA FLOW SUMMARY

### Employee Payslip Workflow:
```
1. Employee navigates to /payroll/employee
2. Frontend calls getMyPayslips() 
3. Backend retrieves from Payslip table, filters by employeeId
4. Employee selects payslip → getPayslipDetail()
5. Can download as PDF via downloadPayslipPdf()
6. Employee can submit inquiry via createInquiry()
7. Can track inquiry status via getMyInquiries()
```

### HR Payroll Workflow:
```
1. HR navigates to /payroll/hr
2. Frontend calls getBatches()
3. HR creates new batch → createBatch(month, year)
4. HR triggers calculation → calculatePayroll(batchId)
   - Backend: Loads attendance, salary profiles
   - Calculates gross/net per employee
   - Stores Payslip & PayslipDetail records
5. HR reviews details → getBatchDetailsForReview()
6. HR can manually adjust → updatePayrollDetail()
7. HR approves → approveBatch()
8. HR sends to Finance → sendPayrollReport() + sendTaxReport()
   - Batch status: DRAFT → PROCESSED → VALIDATED → LOCKED
```

### Finance Payment Workflow:
```
1. Finance user navigates to /payroll/finance
2. Frontend calls getFinanceRequests()
3. Finance reviews pending requests (create by HR when sending report)
4. Finance selects source account → approveAndExecutePayment()
   - Deducts from FinanceAccount
   - Creates PaymentTransaction per employee
   - Marks request as PAID
5. Finance can view history → getPaymentBatches()
6. Finance can see individual transactions → getPaymentTransactions()
```

### Inquiry Workflow:
```
1. Employee creates inquiry → createInquiry()
2. HR views all inquiries (admin) → getAllInquiries()
3. HR replies → replyInquiry()
4. HR updates status → updateInquiryStatus()
5. Employee sees response in getMyInquiries()
```

---

## Database Schema Summary

**Key Tables:**
```
payslips (master payslip)
payslip_details (line items)
payroll_batches (monthly container)
payroll_details (per-employee monthly data)
payroll_periods (reference periods)
salary_profiles (employee salary config)
tax_configs (tax rules)
insurance_configs (insurance rates)
payment_requests (HR → Finance)
payment_batches (payment execution)
payment_transactions (individual transfers)
finance_accounts (fund sources)
financial_transactions (general ledger)
salary_inquiries (support tickets)
salary_inquiry_responses (HR responses)
```

---

## Security Notes
- Employee can only view own payslips (employeeId check)
- HR can view all payslips in batch
- Finance processes payments only with approval
- All endpoints require JWT authentication
- Payslips are immutable once PAID status
- Batches locked cannot be recalculated

---

## Status Enums Reference

| Entity | Status Values | Purpose |
|--------|---------------|---------|
| Payslip | DRAFT, CONFIRMED, PAID, CANCELLED | Payslip lifecycle |
| Batch | DRAFT, PROCESSED, VALIDATED, LOCKED | Batch processing stages |
| Period | OPEN, CLOSED, LOCKED | Period availability |
| Inquiry | OPEN, IN_PROGRESS, RESOLVED, REJECTED | Ticket status |
| PaymentRequest | PENDING, APPROVED, REJECTED, PAID | Payment approval flow |
| PaymentBatch | PROCESSING, COMPLETED, FAILED | Payment execution |
| Transaction | SUCCESS, FAILED, PENDING | Individual transfer status |

---

## Key Files Reference (Quick Lookup)

**Backend Controllers:** 6 files
- EmployeePayslipController, EmployeeInquiryController, HrPayrollController
- PayrollReviewController, FinanceController, SalaryInquiryResponseController

**Backend Services:** 7 files
- PayrollCalculationService, EmployeePayslipService, EmployeePayslipPdfService
- PayrollReviewService, EmployeeInquiryService, FinanceService, SalaryInquiryResponseService

**Backend Entities:** 15 files
- Payslip, PayslipDetail, PayrollBatch, PayrollDetail, PayrollPeriod
- SalaryProfile, TaxConfig, InsuranceConfig, PaymentRequest, PaymentBatch
- PaymentTransaction, FinanceAccount, FinancialTransaction, SalaryInquiry, SalaryInquiryResponse

**Backend Repositories:** 14+ interface definitions

**Backend Enums:** 9 files
- PayslipStatus, BatchStatus, PayrollStatus, InquiryStatus
- PaymentBatchStatus, PaymentRequestStatus, TransactionStatus, PaymentDetailStatus, RequestStatus

**Backend DTOs:** ~15 files (split into Request/Response folders)

**Frontend Components:** 5 files
- PayrollModule, EmployeePayrollView, HRPayrollView, FinancePayrollView, TaxInsuranceReport

**Frontend Services:** 1 file (payrollService.ts)
- ~50+ exported functions covering all API endpoints

---

**Total Count:**
- Backend Java Files: ~50+ (controllers, services, entities, DTOs, repos, enums)
- Frontend Files: 6 (5 components + 1 service)
- Type Definitions: Integrated in types.ts & payrollService.ts
