import React from "react";
import type { CreateNewHireDTO } from "../hooks/types";

// ── Icon Components ──────────────────────────────────────────────────────────
export const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
    <path
      fillRule="evenodd"
      d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"
      clipRule="evenodd"
    />
  </svg>
);

export const XIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
  </svg>
);

export const ArrowRightIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path
      fillRule="evenodd"
      d="M8.22 2.97a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06l2.97-2.97H3.75a.75.75 0 010-1.5h7.44L8.22 4.03a.75.75 0 010-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

export const ArrowLeftIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path
      fillRule="evenodd"
      d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z"
      clipRule="evenodd"
    />
  </svg>
);

export const VerifiedIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path
      fillRule="evenodd"
      d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
      clipRule="evenodd"
    />
  </svg>
);

export const ErrorIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="currentColor"
    className="w-4 h-4 flex-shrink-0"
  >
    <path
      fillRule="evenodd"
      d="M8 15A7 7 0 108 1a7 7 0 000 14zm0-11a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 018 4zm0 9a1 1 0 100-2 1 1 0 000 2z"
      clipRule="evenodd"
    />
  </svg>
);

// ── CSS helpers ──────────────────────────────────────────────────────────────
export const inputCls =
  "w-full px-4 py-2.5 text-sm rounded-xl border border-border-light bg-white text-text-primary-light placeholder:text-text-muted-light focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

export const labelCls =
  "block text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light mb-1.5";

// ── Reusable form primitives ─────────────────────────────────────────────────
export const SelectWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="relative">
    {children}
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light">
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
        <path
          fillRule="evenodd"
          d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  </div>
);

export const SkeletonSelect = () => (
  <div className="h-[42px] rounded-xl bg-gray-100 animate-pulse" />
);

// ── Steps definition ─────────────────────────────────────────────────────────
export const STEPS = [
  {
    id: 0,
    title: "Personal Information",
    description: "Full name, contact details, identity documents",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
      </svg>
    ),
  },
  {
    id: 1,
    title: "Employment Details",
    description: "Department, position, start date",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path
          fillRule="evenodd"
          d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 016 4.193V3.75zm6.5 0v.325a41.622 41.622 0 00-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25zM10 10a1 1 0 00-1 1v.01a1 1 0 001 1h.01a1 1 0 001-1V11a1 1 0 00-1-1H10z"
          clipRule="evenodd"
        />
        <path d="M3 15.055v-.684c.126.053.255.1.39.142 2.1.644 4.313.992 6.61.992 2.297 0 4.51-.348 6.61-.992.135-.041.264-.089.39-.142v.684c0 1.347-.985 2.53-2.363 2.686a41.454 41.454 0 01-9.274 0C3.985 17.585 3 16.402 3 15.055z" />
      </svg>
    ),
  },
];

// ── Default form state factory ───────────────────────────────────────────────
export const makeDefaultFormData = (
  candidateName: string,
  candidatePhone: string,
  candidateEmail: string,
  sourceApplicationId?: string,
): CreateNewHireDTO => ({
  fullName: candidateName,
  phone: candidatePhone,
  email: candidateEmail,
  gender: "MALE",
  address: "",
  departmentId: "",
  positionId: "",
  citizenId: "",
  taxCode: "",
  dateOfBirth: "",
  avatarUrl: "",
  sourceApplicationId: sourceApplicationId ?? null,
  managerId: "",
  dateOfJoining: "",
  role: "ROLE_EMPLOYEE",
  status: "",
  contractNumber: "",
  contractType: "",
  startDate: "",
  endDate: "",
  baseSalary: 0,
});
