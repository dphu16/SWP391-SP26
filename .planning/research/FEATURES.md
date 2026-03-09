# Feature Landscape

**Domain:** Core HR and Minimalist ESS
**Researched:** March 2026

## Table Stakes (Must-Have)

Features required for a baseline functional HR system.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Employee Management | Admin CRUD for all staff. | Medium | Requires complex data validation. |
| Role-Based Access (RBAC) | Separate Admin, Manager, and Employee views. | Medium | Critical for security/privacy. |
| Personal Profile (ESS) | Employees view/edit their own details. | Low | Limited fields (bank info, emergency contact). |
| Leave Management | Request/Approve workflows for time off. | Medium | Requires balance calculations. |
| Department/Org Hierarchy | Define structure and reporting lines. | Low | Managed via `ManagerID`. |

## Differentiators

Features that set the system apart and provide extra value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Automated Payslip PDF | Self-service access to tax/pay records. | Medium | Use OpenPDF for secure generation. |
| Dashboard KPI Widgets | High-level stats (headcount, turnover). | Medium | Visualized via Recharts or Sparklines. |
| Audit Trail History | Full timeline of every record change. | High | Use Hibernate Envers for automated tracking. |
| Global Search | Find anything instantly from a command bar. | Low | Use Cmd+K (K-Bar) pattern. |

## Anti-Features (Avoid)

Features that add bloat and decrease minimalism.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Internal Social Feed | High maintenance, distracts from core tasks. | Integrate with Slack or MS Teams. |
| Built-in LMS (Learning) | Massive scope, better handled by specialized tools. | Link out to external LMS. |
| Manual Data Backup Buttons | Admins shouldn't handle this. | Automate backups at the database layer. |

## Feature Dependencies

```
Role-Based Access (RBAC) → Employee Management (Admins see all, Employees see self)
Employee Management → Leave Management (Balance is tied to employee record)
Audit Trail → All Admin Features (Log every change)
```

## MVP Recommendation

Prioritize a "Clean Core" for Phase 1:
1. **RBAC & Auth:** JWT login for Admin/Employee roles.
2. **Employee CRUD:** Basic HR Admin capability.
3. **Leave Requests:** High-frequency, high-value feature for employees.
4. **Profile View:** Simplest ESS component.

Defer: **Predictive Analytics** and **Internal News Feed**.

## Sources

- [Minimalist ESS Best Practices 2025](https://crazehq.com)
- [HRIS Feature Trends 2026](https://digitalhrms.com)
