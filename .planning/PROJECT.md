# HRM System

## Core Value
A minimalist, action-oriented Human Resource Management (HRM) system that balances administrative control with employee autonomy. It prioritizes essential HR tasks like employee management, self-service (ESS), and reporting while maintaining a clean, high-performance UI/UX.

## Target Users
- **HR Admin:** Manages employee data, departments, job roles, and approvals.
- **Employees:** Accesses their own profiles, payslips, and leave requests via Employee Self-Service (ESS).
- **Managers:** Oversees team data and handles approvals.

## Constraints & Tech Stack
- **Backend:** Spring Boot (Java/Kotlin), PostgreSQL, JWT for Auth, OpenPDF for reporting/payslips.
- **Frontend:** React (TS), Tailwind 4, TanStack Table for data-heavy views.
- **Data Model:** Effective Dating (SCD Type 2) for historical tracking, Hibernate Envers for auditing.
- **Security:** PII Masking at the DTO layer, RBAC.
- **UI/UX:** Minimalist, Inverted Pyramid Admin Dashboard.

## Context
Developed as part of the SWP391 course at FPT University. The goal is to deliver a functional, secure, and user-friendly HR platform.
