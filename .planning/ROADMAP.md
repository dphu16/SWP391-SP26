# Roadmap

## Summary
The HRM system will be delivered in 4 phases, moving from the technical foundation to the full employee self-service experience.

## Phases
- [ ] **Phase 1: Project Scaffolding & Core Auth** - Secure foundation with RBAC and JWT authentication.
- [ ] **Phase 2: Core HR Foundations & Employee Management** - Essential employee record management with historical tracking and auditing.
- [ ] **Phase 3: Admin Command Center** - Advanced administrative tools, dashboards, and approval workflows.
- [ ] **Phase 4: Employee Self-Service (ESS)** - Action-oriented portal for employees to manage their own profiles and requests.

## Phase Details

### Phase 1: Project Scaffolding & Core Auth
**Goal**: Establish the project structure and secure access control.
**Depends on**: Nothing
**Requirements**: SETUP-01, SETUP-02, SETUP-03, AUTH-01, AUTH-02
**Success Criteria**:
  1. User can log in with credentials and receive a JWT token.
  2. Application prevents access to Admin-specific pages for users with only the Employee role.
  3. Development environment is fully operational with Spring Boot and React/Vite integrated.
**Plans**: TBD

### Phase 2: Core HR Foundations & Employee Management
**Goal**: Deliver the primary administrative tools for employee record-keeping with compliance-ready auditing.
**Depends on**: Phase 1
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04, AUTH-03, AUDIT-01
**Success Criteria**:
  1. HR Admin can create, update, and manage employee records (Job, Dept, Compensation).
  2. System automatically tracks data changes using Effective Dating (SCD Type 2), ensuring history is preserved.
  3. Sensitive PII fields are masked at the API level for unauthorized roles.
  4. Detailed audit logs are generated for all entity modifications.
**Plans**: TBD

### Phase 3: Admin Command Center
**Goal**: Build the administrative control layer for managing the organization at scale.
**Depends on**: Phase 2
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, AUDIT-02
**Success Criteria**:
  1. HR Admin sees high-priority metrics (Total Headcount, Pending Approvals) on an Inverted Pyramid Dashboard.
  2. HR Admin can efficiently search and filter large sets of employee data using high-density tables.
  3. HR Admin can review, approve, or reject employee requests (Profile edits, etc.).
**Plans**: TBD

### Phase 4: Employee Self-Service (ESS)
**Goal**: Enable employee autonomy through a minimalist self-service portal.
**Depends on**: Phase 3
**Requirements**: ESS-01, ESS-02, ESS-03, ESS-04
**Success Criteria**:
  1. Employee can view their personalized dashboard showing leave balance and recent activity.
  2. Employee can initiate a profile update request that follows the approval workflow.
  3. Employee can submit leave requests and track their status.
  4. Employee can download their payslips as PDF documents.
**Plans**: TBD

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffolding & Auth | 0/0 | Not started | - |
| 2. Core HR & Data | 0/0 | Not started | - |
| 3. Admin Command Center | 0/0 | Not started | - |
| 4. Employee Self-Service | 0/0 | Not started | - |
