# Domain Pitfalls

**Domain:** Core HR and Minimalist ESS
**Researched:** March 2026

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Overwriting Historical Data
**What goes wrong:** Updating an employee's salary or job title directly in the `employee` table.
**Why it happens:** Developers choose the "simple" path of a direct `UPDATE`.
**Consequences:** HR cannot run historical reports (e.g., "What was our headcount last June?") and cannot audit past pay raises.
**Prevention:** Implement **SCD Type 2 (Effective Dating)** with `valid_from` and `valid_to` columns.

### Pitfall 2: PII Leakage in Global Search
**What goes wrong:** Allowing all users (including employees) to search and see full PII (SSN, Bank Info, Salaries) of others.
**Why it happens:** Over-simplified search indices or lacking field-level security.
**Consequences:** Massive privacy breach, legal liability (GDPR/PII).
**Prevention:** Use **Role-Based DTOs** and a search service that filters based on the user's role.

## Moderate Pitfalls

### Pitfall 3: Poor UX for Data Density
**What goes wrong:** HR Admins struggle to find information in a table with 50+ columns.
**Prevention:** Use a library like **TanStack Table** with robust filtering, sorting, and "Column Selection" (letting admins hide/show columns they need).

### Pitfall 4: Hardcoding Business Logic
**What goes wrong:** Hardcoding approval flows (e.g., "All leave must be approved by Dept Head").
**Prevention:** Use a flexible **ManagerID** hierarchy and a simple "Status" workflow engine.

## Minor Pitfalls

### Pitfall 5: Inefficient PDF Generation
**What goes wrong:** Generating complex payslips synchronously in the main thread.
**Prevention:** For small systems, use a performant library like **OpenPDF**; for larger systems, move to a background task queue.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Core Data Model | No Audit Trail | Enable Hibernate Envers from day one. |
| Admin Dashboard | Performance lag | Implement pagination and lazy loading for large tables. |
| ESS Portal | Unsecured Profile Edits | Limit editable fields to PII only (no job titles/salaries). |

## Sources

- [Common HRIS Pitfalls](https://leavewizard.com)
- [Zero Trust Compliance 2026](https://evolveup.io)
