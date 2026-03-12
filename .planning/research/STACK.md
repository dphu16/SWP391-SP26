# Technology Stack

**Project:** HRM (Human Resource Management)
**Researched:** March 2026

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Spring Boot | 3.5.10 | Backend API | Standard for enterprise Java apps, robust security, and JPA support. |
| React | 19.2.4 | Frontend UI | Modern React (Vite-powered) for reactive and high-performance UI. |
| TypeScript | 5.9.3 | Type Safety | Crucial for managing complex HR data structures. |

### Database
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL | Latest | Relational DB | Strong ACID compliance, JSONB support for semi-structured data. |

### Infrastructure & Security
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Spring Security| 6.4+ | Auth/Authz | Integrated with JWT and RBAC. |
| JJWT | 0.12.6 | JWT Handling | High-level API for token generation and parsing. |
| OpenPDF | 1.3.39 | PDF Generation | Essential for generating payslips and employment contracts. |

### Supporting Libraries (Recommended Additions)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TanStack Table | v8+ | Data Tables | Managing HR Admin tables (sorting, filtering, pagination). |
| Shadcn/ui | Latest | UI Components | Accessible, minimalist UI components tailored for data density. |
| Lucide React | Latest | Iconography | Consistent, minimalist icon set for dashboards. |
| Hibernate Envers| - | Audit Logs | Automatically track every change to the Employee database. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| UI Styling | Tailwind 4 | MUI / Bootstrap | Tailwind 4 offers superior performance and "utility-first" customization. |
| PDF Gen | OpenPDF | iText | OpenPDF is open-source (LGPL/MPL) vs iText's stricter commercial licensing (AGPL). |
| Backend | Spring Boot | Node.js | Spring Boot provides better support for complex business logic and security. |

## Installation (Additions)

```bash
# Frontend Additions
npm install @tanstack/react-table lucide-react clsx tailwind-merge
# (Recommended: Add Shadcn/ui for components)
npx shadcn-ui@latest init
```

```xml
<!-- Backend Additions (in pom.xml) -->
<dependency>
    <groupId>org.hibernate.orm</groupId>
    <artifactId>hibernate-envers</artifactId>
</dependency>
```

## Sources

- `backend/pom.xml`
- `frontend/package.json`
- [Spring Security Documentation](https://spring.io/projects/spring-security)
- [React 19 Release Notes](https://react.dev/blog/2024/12/05/react-19)
- [TanStack Table Docs](https://tanstack.com/table/v8)
