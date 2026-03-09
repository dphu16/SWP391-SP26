# Research Summary: HRM (Human Resource Management)

**Domain:** Core HR and Minimalist Employee Self-Service (ESS)
**Researched:** March 2026
**Overall confidence:** HIGH

## Executive Summary

This research establishes a blueprint for a modern, minimalist HR system that balances administrative control with employee autonomy. Minimalist design in 2026 is **action-oriented**, prioritizing high-frequency tasks (payslips, leave requests, profile updates) over complex, rarely used features. The architecture centers on a robust, historical data model (SCD Type 2) to ensure compliance and auditability, while the UI leverages modern React 19 patterns to manage data density without overwhelming users.

## Key Findings

**Stack:** Spring Boot 3.5.10 (Java 17/Kotlin), React 19 (Tailwind 4), PostgreSQL, JWT + RBAC.
**Architecture:** Layered service-oriented architecture with a focus on **Effective Dating** for employment history and **PII Masking** at the DTO layer.
**Critical pitfall:** Overwriting historical data (e.g., salary changes) without a tracking mechanism, which breaks compliance and reporting.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Phase 1: Core Foundation & Employee Management** - Build the data model, RBAC, and HR Admin CRUD.
   - Addresses: Essential Data Models (Employee, Dept, Job), RBAC (Admin/Manager/Employee).
   - Avoids: Data leakage by implementing PII masking early.

2. **Phase 2: Admin Command Center** - Focus on the HR Admin experience.
   - Addresses: High-density data tables, filters, and KPI dashboards.
   - Avoids: Poor accessibility by using standardized UI components.

3. **Phase 3: Minimalist ESS Portal** - Enable self-service for employees.
   - Addresses: Leave requests, profile editing (with approval workflow), and payslip downloads (PDF).
   - Avoids: Feature creep by strictly sticking to the "Essential 5" features.

**Phase ordering rationale:**
- The data model is the bedrock; without it, self-service features have nothing to act upon.
- Administrative tools provide the "Source of Truth" before opening the system to all employees.

**Research flags for phases:**
- Phase 1: Needs careful implementation of "Effective Dating" in JPA.
- Phase 3: Requires PDF generation logic (OpenPDF) for payslips.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified versions in `pom.xml` and `package.json`. |
| Features | HIGH | Based on 2025/2026 industry trends. |
| Architecture | HIGH | Standard HRIS patterns with modern security. |
| Pitfalls | MEDIUM | General domain pitfalls; specific project constraints may vary. |

## Gaps to Address

- Integration with external payroll providers (if out-of-scope for internal build).
- Mobile app specifics (this research assumes a mobile-responsive web portal).
- Specific local labor law compliance requirements (Vietnam-specific if applicable).
