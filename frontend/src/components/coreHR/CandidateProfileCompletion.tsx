import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../../services/apiClient";
import { sendApprovalRequest } from "../../services/approvalService";
import type { CreateNewHireDTO } from "./types";

const API_URL = "/api/employees/new";

// ============================
// Icon Components
// ============================
const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
    <path
      fillRule="evenodd"
      d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"
      clipRule="evenodd"
    />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path
      fillRule="evenodd"
      d="M8.22 2.97a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06l2.97-2.97H3.75a.75.75 0 010-1.5h7.44L8.22 4.03a.75.75 0 010-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path
      fillRule="evenodd"
      d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z"
      clipRule="evenodd"
    />
  </svg>
);

const ChevronRightIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path
      fillRule="evenodd"
      d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

const VerifiedIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path
      fillRule="evenodd"
      d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
      clipRule="evenodd"
    />
  </svg>
);

const ErrorIcon = () => (
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

// ============================
// CSS helpers
// ============================
const inputCls =
  "w-full px-4 py-2.5 text-sm rounded-xl border border-border-light bg-white text-text-primary-light placeholder:text-text-muted-light focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

const labelCls =
  "block text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light mb-1.5";

// ============================
// Toast Notification
// ============================
interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-lg border animate-slide-in-right max-w-sm ${type === "success"
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-rose-50 border-rose-200 text-rose-800"
        }`}
    >
      <span
        className={`flex-shrink-0 ${type === "success" ? "text-emerald-500" : "text-rose-500"
          }`}
      >
        {type === "success" ? <VerifiedIcon /> : <ErrorIcon />}
      </span>
      <p className="text-sm font-semibold flex-1">{message}</p>
      <button
        onClick={onClose}
        className="ml-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
        aria-label="Dismiss"
      >
        <XIcon />
      </button>
    </div>
  );
};

// ============================
// Steps definition (2 steps)
// ============================
const STEPS = [
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

// ============================
// Step 0: Personal Information
// ============================
interface PersonalInfoFormProps {
  formData: CreateNewHireDTO;
  setFormData: React.Dispatch<React.SetStateAction<CreateNewHireDTO>>;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  formData,
  setFormData,
}) => (
  <div className="space-y-5">
    {/* Row 1: Full Name + Email */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className={labelCls}>
          Full Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) =>
            setFormData({ ...formData, fullName: e.target.value })
          }
          placeholder="e.g. John Doe"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>
          Email Address <span className="text-rose-500">*</span>
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="e.g. john.doe@company.com"
          className={inputCls}
        />
      </div>
    </div>

    {/* Row 2: Phone + Date of Birth */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className={labelCls}>Phone Number</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="e.g. 0901234567"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Date of Birth</label>
        <input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) =>
            setFormData({ ...formData, dateOfBirth: e.target.value })
          }
          className={inputCls}
        />
      </div>
    </div>

    {/* Row 3: Gender */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className={labelCls}>Gender</label>
        <div className="relative">
          <select
            value={formData.gender}
            onChange={(e) =>
              setFormData({
                ...formData,
                gender: e.target.value as CreateNewHireDTO["gender"],
              })
            }
            className={`${inputCls} appearance-none pr-9 cursor-pointer`}
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
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
      </div>
    </div>

    {/* Divider */}
    <div className="pt-1 pb-2 border-b border-border-light">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">
        Identity & Legal Documents
      </p>
    </div>

    {/* Row 4: Citizen ID + Tax Code */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className={labelCls}>Citizen ID / National ID</label>
        <input
          type="text"
          value={formData.citizenId}
          onChange={(e) =>
            setFormData({ ...formData, citizenId: e.target.value })
          }
          placeholder="e.g. 001234567890"
          className={`${inputCls} font-mono`}
        />
      </div>
      <div>
        <label className={labelCls}>Personal Tax ID</label>
        <input
          type="text"
          value={formData.taxCode}
          onChange={(e) =>
            setFormData({ ...formData, taxCode: e.target.value })
          }
          placeholder="e.g. 0987654321"
          className={`${inputCls} font-mono`}
        />
      </div>
    </div>

    {/* Row 5: Address */}
    <div>
      <label className={labelCls}>Permanent Address</label>
      <input
        type="text"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        placeholder="e.g. 123 Nguyen Hue St, District 1, HCMC"
        className={inputCls}
      />
    </div>
  </div>
);

// ============================
// Step 1: Employment Details
// ============================
interface DepartmentOption {
  id: string;
  name: string;
}

interface PositionOption {
  id: string;
  title: string;
}

interface EmploymentDetailsFormProps {
  formData: CreateNewHireDTO;
  setFormData: React.Dispatch<React.SetStateAction<CreateNewHireDTO>>;
}

const EmploymentDetailsForm: React.FC<EmploymentDetailsFormProps> = ({
  formData,
  setFormData,
}) => {
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    Promise.all([
      apiClient.get<DepartmentOption[]>("/api/lookup/departments"),
      apiClient.get<PositionOption[]>("/api/lookup/positions"),
    ])
      .then(([deptRes, posRes]) => {
        if (cancelled) return;
        setDepartments(deptRes.data);
        setPositions(posRes.data);
      })
      .catch(() => {
        if (!cancelled)
          setFetchError("Failed to load lookup data. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const SkeletonSelect = () => (
    <div className="h-[42px] rounded-xl bg-gray-100 animate-pulse" />
  );

  const SelectWrapper = ({ children }: { children: React.ReactNode }) => (
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

  return (
    <div className="space-y-5">
      {/* Error */}
      {fetchError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          <ErrorIcon />
          {fetchError}
        </div>
      )}

      {/* Row 1: Department + Position */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>
            Department <span className="text-rose-500">*</span>
          </label>
          {loading ? (
            <SkeletonSelect />
          ) : (
            <SelectWrapper>
              <select
                value={formData.departmentId}
                onChange={(e) =>
                  setFormData({ ...formData, departmentId: e.target.value })
                }
                disabled={!!fetchError}
                className={`${inputCls} appearance-none pr-9 cursor-pointer`}
              >
                <option value="" disabled>
                  Select department…
                </option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </SelectWrapper>
          )}
        </div>

        <div>
          <label className={labelCls}>
            Position <span className="text-rose-500">*</span>
          </label>
          {loading ? (
            <SkeletonSelect />
          ) : (
            <SelectWrapper>
              <select
                value={formData.positionId}
                onChange={(e) =>
                  setFormData({ ...formData, positionId: e.target.value })
                }
                disabled={!!fetchError}
                className={`${inputCls} appearance-none pr-9 cursor-pointer`}
              >
                <option value="" disabled>
                  Select position…
                </option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </SelectWrapper>
          )}
        </div>
      </div>

      {/* Row 2: Manager ID + Joining Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Mentor ID</label>
          <input
            type="text"
            value={formData.managerId ?? ""}
            onChange={(e) =>
              setFormData({ ...formData, managerId: e.target.value })
            }
            placeholder="e.g. UUID of manager"
            className={`${inputCls} font-mono`}
          />
        </div>
        <div>
          <label className={labelCls}>Joining Date</label>
          <input
            type="date"
            value={formData.dateOfJoining ?? ""}
            onChange={(e) =>
              setFormData({ ...formData, dateOfJoining: e.target.value })
            }
            className={inputCls}
          />
        </div>
      </div>

      {/* Row 3: Role + Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>
            Role <span className="text-rose-500">*</span>
          </label>
          <SelectWrapper>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className={`${inputCls} appearance-none pr-9 cursor-pointer`}
            >
              <option value="ROLE_EMPLOYEE">Employee</option>
              <option value="ROLE_MANAGER">Manager</option>
              <option value="ROLE_MENTOR">Mentor</option>
              <option value="ROLE_HR">HR</option>
              <option value="ROLE_FINANCE">Finance</option>
              <option value="ROLE_INTERN">Intern</option>
              <option value="ROLE_PROBATION">Probation</option>
            </select>
          </SelectWrapper>
        </div>

        <div>
          <label className={labelCls}>
            Status <span className="text-rose-500">*</span>
          </label>
          <SelectWrapper>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className={`${inputCls} appearance-none pr-9 cursor-pointer`}
            >
              <option value="" disabled>
                Select status...
              </option>
              <option value="OFFICIAL">Official</option>
              <option value="INTERN">Intern</option>
              <option value="PROBATION">Probation</option>
            </select>
          </SelectWrapper>
        </div>
      </div>

      {/* Divider: Contract Section */}
      <div className="pt-1 pb-2 border-b border-border-light">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">
          Contract Information
        </p>
      </div>

      {/* Row 4: Contract Number + Contract Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Contract Number</label>
          <input
            type="text"
            value={formData.contractNumber ?? ""}
            onChange={(e) =>
              setFormData({ ...formData, contractNumber: e.target.value })
            }
            placeholder="e.g. HD-2026-NVB-001"
            className={`${inputCls} font-mono`}
          />
        </div>
        <div>
          <label className={labelCls}>Contract Type</label>
          <SelectWrapper>
            <select
              value={formData.contractType ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, contractType: e.target.value })
              }
              className={`${inputCls} appearance-none pr-9 cursor-pointer`}
            >
              <option value="" disabled>
                Select type…
              </option>
              <option value="THU_VIEC">Thử việc (Probation)</option>
              <option value="PROBATION">Probation</option>
              <option value="DEFINITE">Definite</option>
              <option value="INDEFINITE">Indefinite</option>
            </select>
          </SelectWrapper>
        </div>
      </div>

      {/* Row 5: Start Date + End Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Start Date</label>
          <input
            type="date"
            value={formData.startDate ?? ""}
            onChange={(e) =>
              setFormData({ ...formData, startDate: e.target.value })
            }
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>End Date</label>
          <input
            type="date"
            value={formData.endDate ?? ""}
            onChange={(e) =>
              setFormData({ ...formData, endDate: e.target.value })
            }
            className={inputCls}
          />
        </div>
      </div>

      {/* Row 6: Base Salary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>
            Base Salary <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            value={formData.baseSalary}
            onChange={(e) =>
              setFormData({
                ...formData,
                baseSalary: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="e.g. 15000000"
            className={`${inputCls} font-mono`}
          />
        </div>
      </div>

      {/* Summary card */}
      <div className="mt-2 rounded-xl border border-border-light bg-gray-50 p-4 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">
          Information Summary
        </p>
        {[
          { label: "Full Name", value: formData.fullName },
          { label: "Email", value: formData.email },
          { label: "Phone Number", value: formData.phone },
          {
            label: "Department",
            value: departments.find((d) => d.id === formData.departmentId)
              ?.name,
          },
          {
            label: "Position",
            value: positions.find((p) => p.id === formData.positionId)?.title,
          },
          { label: "Role", value: formData.role },
          { label: "Status", value: formData.status },
          { label: "Contract Number", value: formData.contractNumber },
          { label: "Contract Type", value: formData.contractType },
          { label: "Start Date", value: formData.startDate },
          { label: "End Date", value: formData.endDate },
          {
            label: "Base Salary",
            value: formData.baseSalary
              ? `${formData.baseSalary.toLocaleString()} VND`
              : undefined,
          },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-4">
            <span className="text-xs text-text-secondary-light font-medium flex-shrink-0">
              {label}
            </span>
            <span className="text-xs font-semibold text-text-primary-light text-right truncate max-w-[200px]">
              {value || (
                <span className="text-text-muted-light font-normal">—</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================
// Default form state factory
// ============================
const makeDefaultFormData = (
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

// ============================
// Main Component
// ============================
const CandidateProfileCompletion: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const action = searchParams.get("action") || "init";
  const isResubmit = action === "resubmit";

  const candidateName = searchParams.get("name") || "";
  const candidateEmail = searchParams.get("email") || "";
  const candidatePhone = searchParams.get("phone") || "";
  const jobTitle = searchParams.get("job") || "";

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingEmployee, setLoadingEmployee] = useState(isResubmit);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [formData, setFormData] = useState<CreateNewHireDTO>(
    makeDefaultFormData(
      candidateName,
      candidatePhone,
      candidateEmail,
      isResubmit ? undefined : applicationId,
    ),
  );

  // Load existing employee data for resubmit mode
  useEffect(() => {
    if (!isResubmit || !applicationId) return;
    let cancelled = false;
    setLoadingEmployee(true);
    apiClient
      .get<CreateNewHireDTO>(`/api/employees/${applicationId}/edit`)
      .then((res) => {
        if (cancelled) return;
        const data = res.data;
        setFormData({
          fullName: data.fullName || "",
          phone: data.phone || "",
          email: data.email || "",
          gender: data.gender || "MALE",
          address: data.address || "",
          departmentId: data.departmentId || "",
          positionId: data.positionId || "",
          citizenId: data.citizenId || "",
          taxCode: data.taxCode || "",
          dateOfBirth: data.dateOfBirth || "",
          avatarUrl: data.avatarUrl || "",
          sourceApplicationId: null,
          managerId: data.managerId || "",
          dateOfJoining: data.dateOfJoining || "",
          role: data.role || "ROLE_EMPLOYEE",
          status: data.status || "",
          contractNumber: data.contractNumber || "",
          contractType: data.contractType || "",
          startDate: data.startDate || "",
          endDate: data.endDate || "",
          baseSalary: data.baseSalary || 0,
        });
      })
      .catch(() => {
        if (!cancelled)
          setToast({ message: "Failed to load employee data.", type: "error" });
      })
      .finally(() => {
        if (!cancelled) setLoadingEmployee(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isResubmit, applicationId]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateStep = (step: number): string | null => {
    if (step === 0) {
      if (!formData.fullName.trim()) return "Full Name is required.";
      if (!formData.email.trim()) return "Email Address is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        return "Invalid email format.";
      if (formData.citizenId && formData.citizenId.trim().length < 9)
        return "Citizen ID must be at least 9 characters.";
      if (formData.taxCode && formData.taxCode.trim().length < 10)
        return "Tax ID must be at least 10 characters.";
      return null;
    }
    if (step === 1) {
      if (!formData.departmentId) return "Please select a department.";
      if (!formData.positionId) return "Please select a position.";
      if (!formData.status) return "Please select a target status.";
      return null;
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(currentStep);
    if (err) {
      setToast({ message: err, type: "error" });
      return;
    }
    setCurrentStep(1);
  };

  const handleBack = () => setCurrentStep(0);

  const handleSubmit = async () => {
    const err = validateStep(currentStep);
    if (err) {
      setToast({ message: err, type: "error" });
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      if (isResubmit && applicationId) {
        // Resubmit mode: update employee data and resubmit for approval
        await apiClient.put(
          `/api/employees/${applicationId}/resubmit`,
          formData,
        );
        setToast({
          message: "Employee updated and resubmitted for approval!",
          type: "success",
        });
        setTimeout(() => navigate("/onboarding/progress"), 1500);
      } else {
        // Create mode: create new employee
        const response = await apiClient.post(API_URL, formData);
        const employeeId = response.data?.employeeId;

        // Auto-send approval request to Manager
        if (employeeId) {
          try {
            await sendApprovalRequest(employeeId);
            setToast({
              message:
                "Employee successfully created and approval request sent!",
              type: "success",
            });
            setTimeout(() => navigate("/onboarding"), 1500);
          } catch (err: any) {
            const errorMsg =
              err.response?.data?.message ||
              err.response?.data?.error ||
              err.message ||
              "Unknown error";
            setSubmitError(
              `Employee created, but failed to send approval request: ${errorMsg}`,
            );
            setToast({
              message: "Failed to send approval request.",
              type: "error",
            });
            // Stop execution here so we don't navigate, allowing the user to see the error
            return;
          }
        } else {
          setToast({
            message: "Employee successfully created!",
            type: "success",
          });
          setTimeout(() => navigate("/onboarding"), 1500);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && "response" in err) {
        const axErr = err as {
          response?: { status: number; statusText: string; data?: any };
        };
        const data = axErr.response?.data;

        let message =
          data?.message ||
          data?.error ||
          `Error ${axErr.response?.status}: ${axErr.response?.statusText}`;

        if (data?.details) {
          message +=
            " - " +
            (Array.isArray(data.details)
              ? data.details.join(", ")
              : String(data.details));
        } else if (data?.errors) {
          if (typeof data.errors === "object" && !Array.isArray(data.errors)) {
            const vals = Object.values(data.errors).filter(Boolean);
            if (vals.length > 0) message = vals.join(", ");
          } else if (Array.isArray(data.errors)) {
            message = data.errors
              .map((e: any) => e.defaultMessage || e.message || String(e))
              .join(", ");
          } else {
            message += " - " + String(data.errors);
          }
        } else if (typeof data === "string") {
          message = data;
        }

        setSubmitError(message);
        setToast({ message, type: "error" });
      } else {
        const message = "An unexpected error occurred.";
        setSubmitError(message);
        setToast({ message, type: "error" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoBack = () =>
    navigate(isResubmit ? "/onboarding/progress" : "/onboarding");

  // ── Avatar ──────────────────────────────────────────────────────────────────
  const avatarColors = [
    "bg-primary/15 text-primary",
    "bg-blue-100 text-blue-600",
    "bg-purple-100 text-purple-600",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-600",
  ];
  const avatarColor =
    avatarColors[(formData.fullName?.charCodeAt(0) ?? 0) % avatarColors.length];
  const avatarInitials =
    formData.fullName
      ?.split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const progressPct = Math.round((currentStep / STEPS.length) * 100);

  return (
    <>
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="pt-6">
        {loadingEmployee ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-text-secondary-light">
              Loading employee data…
            </span>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* ── Left Column ── */}
              <div className="w-full lg:w-72 lg:flex-shrink-0 lg:sticky lg:top-6 flex flex-col gap-4">
                {/* Candidate Card */}
                <div className="rounded-2xl border border-border-light bg-surface-light shadow-card overflow-hidden animate-fade-in">
                  <div className="h-14 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
                  <div className="px-5 pb-5 -mt-7">
                    <div className="flex items-end gap-3 mb-4">
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 ring-4 ring-surface-light ${avatarColor}`}
                      >
                        {avatarInitials}
                      </div>
                      <div className="pb-1">
                        <h2 className="text-sm font-bold text-text-primary-light leading-tight">
                          {formData.fullName || "New Employee"}
                        </h2>
                        <p className="text-xs text-text-secondary-light mt-0.5">
                          {jobTitle || "Onboarding"}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-medium text-text-secondary-light">
                          Completion Progress
                        </span>
                        <span className="font-bold text-primary">
                          {progressPct}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {applicationId && (
                      <div className="mt-4 pt-4 border-t border-border-light space-y-2">
                        {[
                          { label: "Email", value: formData.email },
                          { label: "Phone", value: formData.phone },
                        ].map(({ label, value }) => (
                          <div
                            key={label}
                            className="flex justify-between items-center"
                          >
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">
                              {label}
                            </span>
                            <span className="text-xs font-medium text-text-primary-light truncate max-w-[130px]">
                              {value || "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Step Navigator */}
                <div className="rounded-2xl border border-border-light bg-surface-light shadow-card overflow-hidden animate-fade-in">
                  <div className="px-4 py-3.5 border-b border-border-light">
                    <p className="text-xs font-bold text-text-primary-light uppercase tracking-wider">
                      Onboarding Steps
                    </p>
                  </div>

                  <div className="divide-y divide-gray-50">
                    {STEPS.map((step, index) => {
                      const isActive = currentStep === index;
                      const isCompleted = currentStep > index;

                      return (
                        <button
                          key={step.id}
                          disabled={index > currentStep && !isCompleted}
                          onClick={() => {
                            if (index < currentStep || isCompleted) {
                              setCurrentStep(index);
                            }
                          }}
                          className={`w-full text-left px-4 py-4 transition-colors flex items-center gap-3 relative ${index <= currentStep
                              ? "cursor-pointer hover:bg-gray-50"
                              : "cursor-not-allowed opacity-50"
                            } ${isActive ? "bg-primary/5" : ""}`}
                        >
                          {/* Active bar */}
                          {isActive && (
                            <span className="absolute left-0 top-3 bottom-3 w-0.5 bg-primary rounded-r-full" />
                          )}

                          {/* Circle */}
                          <div
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isCompleted
                                ? "border-primary bg-primary text-white"
                                : isActive
                                  ? "border-primary text-primary"
                                  : "border-gray-300 text-gray-300"
                              }`}
                          >
                            {isCompleted ? (
                              <CheckIcon />
                            ) : (
                              <span>{step.icon}</span>
                            )}
                          </div>

                          {/* Label */}
                          <div className="flex-1 min-w-0">
                            <span
                              className={`text-xs block font-semibold truncate ${isActive
                                  ? "text-text-primary-light"
                                  : isCompleted
                                    ? "text-text-secondary-light line-through decoration-gray-400"
                                    : "text-text-primary-light"
                                }`}
                            >
                              {step.title}
                            </span>
                            {isActive && (
                              <p className="text-[11px] text-text-secondary-light mt-0.5 truncate">
                                {step.description}
                              </p>
                            )}
                          </div>

                          {/* Badge */}
                          {isCompleted && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 whitespace-nowrap">
                              Done
                            </span>
                          )}
                          {isActive && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 whitespace-nowrap">
                              Active
                            </span>
                          )}
                          {!isCompleted && !isActive && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-100 text-text-muted-light whitespace-nowrap">
                              Pending
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Submit CTA in sidebar */}
                  <div className="p-4 border-t border-border-light">
                    <button
                      className={`w-full py-2.5 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm ${currentStep === STEPS.length - 1
                          ? "bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20 cursor-pointer btn-primary-action"
                          : "bg-gray-100 text-text-muted-light cursor-not-allowed"
                        }`}
                      disabled={currentStep !== STEPS.length - 1 || submitting}
                      onClick={handleSubmit}
                    >
                      <VerifiedIcon />
                      {submitting
                        ? "Processing…"
                        : isResubmit
                          ? "Update & Resubmit"
                          : "Finish & Create Employee"}
                    </button>
                    <p className="text-[11px] text-text-secondary-light mt-2 text-center">
                      Complete all 2 steps to activate
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Right Column: Main Form ── */}
              <div className="flex-1 min-w-0">
                <div className="rounded-2xl border border-border-light bg-surface-light shadow-card overflow-hidden animate-fade-in">
                  {/* Form content */}
                  <div className="p-6 md:p-8 min-h-[520px]">
                    {currentStep === 0 && (
                      <PersonalInfoForm
                        formData={formData}
                        setFormData={setFormData}
                      />
                    )}
                    {currentStep === 1 && (
                      <EmploymentDetailsForm
                        formData={formData}
                        setFormData={setFormData}
                      />
                    )}

                    {/* Error alert */}
                    {submitError && (
                      <div className="mt-6 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 animate-slide-up">
                        <span className="text-rose-500 mt-0.5">
                          <ErrorIcon />
                        </span>
                        <p className="text-sm font-medium text-rose-800">
                          {submitError}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="bg-gray-50 px-6 py-4 border-t border-border-light flex items-center justify-between sticky bottom-0 z-10">
                    <button
                      onClick={handleGoBack}
                      className="text-sm font-medium text-text-secondary-light hover:text-text-primary-light transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <div className="flex items-center gap-3">
                      {currentStep > 0 && (
                        <button
                          onClick={handleBack}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-border-light rounded-xl text-sm font-medium text-text-primary-light hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <ArrowLeftIcon />
                          Back
                        </button>
                      )}

                      {currentStep < STEPS.length - 1 ? (
                        <button
                          onClick={handleNext}
                          className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold shadow-sm shadow-primary/20 transition-all cursor-pointer btn-primary-action"
                        >
                          Next Step
                          <ArrowRightIcon />
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmit}
                          disabled={submitting}
                          className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold shadow-sm shadow-primary/20 transition-all cursor-pointer btn-primary-action disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <VerifiedIcon />
                          )}
                          {submitting
                            ? "Submitting…"
                            : isResubmit
                              ? "Update & Resubmit"
                              : "Finish & Create"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CandidateProfileCompletion;
