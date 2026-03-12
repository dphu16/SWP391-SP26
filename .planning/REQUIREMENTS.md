# Requirements

## v1 Requirements

### SETUP: Infrastructure & Scaffolding
- **SETUP-01:** Spring Boot 3.x project setup with PostgreSQL.
- **SETUP-02:** React 19 / Vite with Tailwind CSS 4.
- **SETUP-03:** TanStack Table and basic UI component library integration.

### AUTH: Security & Access Control
- **AUTH-01:** JWT-based authentication for secure login.
- **AUTH-02:** RBAC (Role-Based Access Control) for HR Admin, Manager, and Employee roles.
- **AUTH-03:** PII (Personally Identifiable Information) masking at the DTO layer for sensitive fields.

### CORE: Core HR Data & Employee Management
- **CORE-01:** CRUD operations for Employee records (Personal Info, Job, Dept).
- **CORE-02:** Implementation of **Effective Dating (SCD Type 2)** for historical employment tracking.
- **CORE-03:** Organizational structure management (Departments, Job Roles).
- **CORE-04:** Basic salary and compensation record management.

### ADMIN: Admin Tools & Dashboard
- **ADMIN-01:** **Inverted Pyramid Dashboard** for high-priority administrative metrics.
- **ADMIN-02:** High-density data tables using **TanStack Table** with filtering and pagination.
- **ADMIN-03:** Approval workflow engine for employee requests (e.g., profile changes).

### ESS: Employee Self-Service
- **ESS-01:** **Action-oriented ESS Dashboard** for employees (Leave balance, next payslip).
- **ESS-02:** Profile view and "Edit with Approval" workflow for specific fields.
- **ESS-03:** Leave management system (Request, balance tracking).
- **ESS-04:** Payslip viewing and downloading using **OpenPDF**.

### AUDIT: Compliance & Tracking
- **AUDIT-01:** Automated auditing of entity changes using **Hibernate Envers**.
- **AUDIT-02:** System logs for critical administrative actions.

## v2 Requirements (Deferred)
- External payroll integration.
- Advanced performance review module.
- Recruitment and ATS integration.
- Mobile application.

## Traceability
| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | Phase 1 | Pending |
| SETUP-02 | Phase 1 | Pending |
| SETUP-03 | Phase 1 | Pending |
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 2 | Pending |
| CORE-01 | Phase 2 | Pending |
| CORE-02 | Phase 2 | Pending |
| CORE-03 | Phase 2 | Pending |
| CORE-04 | Phase 2 | Pending |
| ADMIN-01 | Phase 3 | Pending |
| ADMIN-02 | Phase 3 | Pending |
| ADMIN-03 | Phase 3 | Pending |
| ESS-01 | Phase 4 | Pending |
| ESS-02 | Phase 4 | Pending |
| ESS-03 | Phase 4 | Pending |
| ESS-04 | Phase 4 | Pending |
| AUDIT-01 | Phase 2 | Pending |
| AUDIT-02 | Phase 3 | Pending |
