# Architecture Patterns

**Domain:** Core HR and Minimalist ESS
**Researched:** March 2026

## Recommended Architecture

A layered **Service-Oriented Architecture** (SOA) that keeps the core business logic independent of external integrations.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Auth Service** | JWT issuance, RBAC, session management. | All services (via Interceptors). |
| **Employee Service** | Core CRUD, PII masking, data validation. | DB, Org Service. |
| **Org Service** | Department hierarchy, reporting lines. | Employee Service. |
| **Self-Service (ESS)** | Leave requests, profile edits, document access. | Employee Service, PDF Service. |
| **Audit Log (Envers)** | Automated change tracking for all entities. | Hibernate (Internal). |

### Data Flow

1. **Request:** User makes a request (e.g., Update Profile).
2. **Auth:** Filter checks JWT and RBAC permissions.
3. **Logic:** Service validates business rules (e.g., can only edit specific fields).
4. **Audit:** Hibernate Envers creates a "revision" in the `_aud` table.
5. **Masking:** DTO layer masks sensitive PII before returning to the UI.

## Patterns to Follow

### Pattern 1: Effective Dating (SCD Type 2)
**What:** Storing historical versions of records using `valid_from` and `valid_to` timestamps.
**When:** For salary, job titles, and department assignments.
**Example:**
```sql
-- Employee History Table
SELECT * FROM employee_history 
WHERE employee_id = 1 
AND '2026-03-01' BETWEEN valid_from AND valid_to;
```

### Pattern 2: PII Masking at the DTO Level
**What:** Replacing sensitive data (e.g., SSN, Bank Account) with "XXXX" for non-admin users.
**Why:** Prevents accidental data leakage in the frontend.
**Example:**
```typescript
interface EmployeeSummaryDTO {
  id: string;
  name: string;
  // Masked: "XXXX-XXXX-1234"
  bankAccount: string; 
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Large "God" Table
**What:** Putting all employee info (address, bank, performance, salary) in one table.
**Why bad:** Performance bottlenecks and security risks (hard to limit access to specific columns).
**Instead:** Split into `Employee`, `PayrollInfo`, `PersonalInfo`, and `JobDetails`.

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| Table Performance | Basic indexing. | Partition by Department ID. | Use Read-Replicas for reporting. |
| Audit Log Volume | Store in main DB. | Archive to separate Audit DB. | Use dedicated logging service (WORM). |
| PDF Generation | Generate on-the-fly. | Queue via Redis/RabbitMQ. | Specialized PDF microservice. |

## Sources

- [Core HR Data Model Patterns](https://geeksforgeeks.org)
- [Zero Trust Architecture for HR](https://paperclip.com)
