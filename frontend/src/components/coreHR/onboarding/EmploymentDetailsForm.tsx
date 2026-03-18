import React from "react";
import {
  inputCls,
  labelCls,
  SelectWrapper,
  SkeletonSelect,
  ErrorIcon,
} from "./formConstants";
import type { CreateNewHireDTO } from "../hooks/types";
import type { FieldErrors } from "../hooks/useCandidateOnboarding";
import { numberToVietnameseWords } from "../../../utils/numberToVietnameseWords";

import { useEmploymentData, useJobAutoFill, usePositionDepartmentSync, type DepartmentOption, type PositionOption } from "./hooks/useEmploymentData";


interface EmploymentDetailsFormProps {
  formData: CreateNewHireDTO;
  setFormData: React.Dispatch<React.SetStateAction<CreateNewHireDTO>>;
  jobId?: string;
  fieldErrors: FieldErrors;
  clearFieldError: (field: string) => void;
  onFileChange: (file: File | null) => void;
  contractFileName: string | null;
}

// =======================
// UI Subcomponents
// =======================

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? <p className="mt-1 text-xs text-rose-500 font-medium">{message}</p> : null;

const errorBorder = (fieldErrors: FieldErrors, field: string) =>
  fieldErrors[field] ? "border-rose-400 focus:ring-rose-300" : "";

interface SharedProps {
  formData: CreateNewHireDTO;
  fieldErrors: FieldErrors;
  update: (field: keyof CreateNewHireDTO, val: string | number) => void;
}

const ProfessionInfoSection: React.FC<SharedProps & {
  departments: DepartmentOption[];
  positions: PositionOption[];
  loading: boolean;
  fetchError: string | null;
  isDeptLocked: boolean;
  isPosLocked: boolean;
}> = ({ formData, fieldErrors, update, departments, positions, loading, fetchError, isDeptLocked, isPosLocked }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            onChange={(e) => update("departmentId", e.target.value)}
            disabled={!!fetchError || isDeptLocked}
            className={`${inputCls} appearance-none pr-9 ${isDeptLocked ? 'cursor-not-allowed bg-gray-50 text-text-secondary-light' : 'cursor-pointer'} ${errorBorder(fieldErrors, "departmentId")}`}
          >
            <option value="" disabled>Select department…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </SelectWrapper>
      )}
      <FieldError message={fieldErrors.departmentId} />
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
            onChange={(e) => update("positionId", e.target.value)}
            disabled={!!fetchError || isPosLocked}
            className={`${inputCls} appearance-none pr-9 ${isPosLocked ? 'cursor-not-allowed bg-gray-50 text-text-secondary-light' : 'cursor-pointer'} ${errorBorder(fieldErrors, "positionId")}`}
          >
            <option value="" disabled>Select position…</option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </SelectWrapper>
      )}
      <FieldError message={fieldErrors.positionId} />
    </div>

    <div>
      <label className={labelCls}>
        Employment Status <span className="text-rose-500">*</span>
      </label>
      <SelectWrapper>
        <select
          value={formData.status}
          onChange={(e) => update("status", e.target.value)}
          className={`${inputCls} appearance-none pr-9 cursor-pointer ${errorBorder(fieldErrors, "status")}`}
        >
          <option value="" disabled>Select status...</option>
          <option value="OFFICIAL">Official</option>
          <option value="INTERN">Intern</option>
          <option value="PROBATION">Probation</option>
        </select>
      </SelectWrapper>
      <FieldError message={fieldErrors.status} />
    </div>

    <div>
      <label className={labelCls}>
        Joining Date <span className="text-rose-500">*</span>
      </label>
      <input
        type="date"
        value={formData.dateOfJoining ?? ""}
        onChange={(e) => update("dateOfJoining", e.target.value)}
        className={`${inputCls} ${errorBorder(fieldErrors, "dateOfJoining")}`}
      />
      <FieldError message={fieldErrors.dateOfJoining} />
    </div>
  </div>
);

// JoiningDateSection integrated into ProfessionInfoSection

// StatusSection is now integrated into ProfessionInfoSection

const ContractSection: React.FC<SharedProps & { onFileChange: (file: File | null) => void; contractFileName: string | null; }> = ({ formData, fieldErrors, update, onFileChange, contractFileName }) => (
  <div className="space-y-4">
    <div className="pt-2 border-b border-border-light">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">
        Contract & Legal Documents
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label className={labelCls}>Contract Number</label>
        <input
          type="text"
          value={formData.contractNumber ?? ""}
          onChange={(e) => update("contractNumber", e.target.value)}
          placeholder="e.g. HD-2026-NVB-001"
          className={`${inputCls} font-mono`}
        />
      </div>
      <div>
        <label className={labelCls}>
          Start Date <span className="text-rose-500">*</span>
        </label>
        <input
          type="date"
          value={formData.startDate ?? ""}
          onChange={(e) => update("startDate", e.target.value)}
          className={`${inputCls} ${errorBorder(fieldErrors, "startDate")}`}
        />
        <FieldError message={fieldErrors.startDate} />
      </div>
      <div>
        <label className={labelCls}>Duration</label>
        <SelectWrapper>
          <select
            value={formData.contractDuration ?? ""}
            onChange={(e) => {
              update("contractDuration", e.target.value);
              if (e.target.value !== "CUSTOM") update("endDate", "");
            }}
            className={`${inputCls} appearance-none pr-9 cursor-pointer`}
          >
            <option value="" disabled>Select duration…</option>
            <option value="6_MONTHS">6 Months</option>
            <option value="1_YEAR">1 Year</option>
            <option value="2_YEARS">2 Years</option>
            <option value="INDEFINITE">Indefinite</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </SelectWrapper>
        {formData.startDate && formData.contractDuration && formData.contractDuration !== "CUSTOM" && formData.contractDuration !== "INDEFINITE" && (() => {
          const start = new Date(formData.startDate);
          let end: Date | null = null;
          if (formData.contractDuration === "6_MONTHS") { end = new Date(start); end.setMonth(end.getMonth() + 6); }
          else if (formData.contractDuration === "1_YEAR") { end = new Date(start); end.setFullYear(end.getFullYear() + 1); }
          else if (formData.contractDuration === "2_YEARS") { end = new Date(start); end.setFullYear(end.getFullYear() + 2); }
          return end ? (
            <p className="mt-1 text-[11px] text-primary font-medium">Auto-end: {end.toLocaleDateString("vi-VN")}</p>
          ) : null;
        })()}
      </div>
    </div>

    {formData.contractDuration === "CUSTOM" && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="lg:col-start-3">
          <label className={labelCls}>Specific End Date</label>
          <input
            type="date"
            value={formData.endDate ?? ""}
            onChange={(e) => update("endDate", e.target.value)}
            className={`${inputCls} ${errorBorder(fieldErrors, "endDate")}`}
          />
          <FieldError message={fieldErrors.endDate} />
        </div>
      </div>
    )}

    {/* Salary Section Integrated for Flow */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className={labelCls}>
          Base Salary <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            value={formData.baseSalary}
            onChange={(e) => update("baseSalary", parseFloat(e.target.value) || 0)}
            placeholder="e.g. 15000000"
            className={`${inputCls} font-mono pl-12 ${errorBorder(fieldErrors, "baseSalary")}`}
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted-light font-medium text-xs">VND</span>
        </div>
        <FieldError message={fieldErrors.baseSalary} />
      </div>
      <div className="flex flex-col justify-center">
         {formData.baseSalary > 0 && (
           <p className="text-[11px] text-text-secondary-light italic bg-gray-50 p-2 rounded-lg border border-gray-100">
             {numberToVietnameseWords(formData.baseSalary)} đồng
           </p>
         )}
      </div>
    </div>

    <div>
      <label className={labelCls}>Contract Attachment (Optional)</label>
      <label className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-border-light bg-gray-50 hover:border-primary hover:bg-emerald-50 transition-colors cursor-pointer group">
        <input type="file" accept=".pdf" className="hidden" onChange={(e) => onFileChange(e.target.files?.[0] ?? null)} />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-text-muted-light group-hover:text-primary flex-shrink-0">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <div className="flex-1 min-w-0">
          {contractFileName ? (
            <p className="text-sm font-semibold text-emerald-700 truncate">✓ {contractFileName}</p>
          ) : (
            <p className="text-sm text-text-muted-light">Upload PDF contract...</p>
          )}
        </div>
        {contractFileName && (
          <button type="button" onClick={(e) => { e.preventDefault(); onFileChange(null); }} className="text-xs text-rose-500 hover:text-rose-700 font-medium">Remove</button>
        )}
      </label>
    </div>
  </div>
);

// SalarySection integrated into ContractSection for better flow

const InformationSummarySection: React.FC<{
  formData: CreateNewHireDTO;
  departments: DepartmentOption[];
  positions: PositionOption[];
}> = ({ formData, departments, positions }) => {
  const salaryInWords = numberToVietnameseWords(formData.baseSalary);
  
  const items = [
    { label: "Full Name", value: formData.fullName },
    { label: "Email", value: formData.email },
    { label: "Phone Number", value: formData.phone },
    { label: "Department", value: departments.find((d) => d.id === formData.departmentId)?.name },
    { label: "Position", value: positions.find((p) => p.id === formData.positionId)?.title },
    { 
      label: "Role", 
      value: departments.find(d => d.id === formData.departmentId)?.name === "Human Resources" ? "HR" : 
             departments.find(d => d.id === formData.departmentId)?.name === "Finance" ? "Finance" : "Employee"
    },
    { label: "Status", value: formData.status },
    { label: "Contract Number", value: formData.contractNumber },
    { label: "Start Date", value: formData.startDate },
    { label: "Contract Duration", value: formData.contractDuration === "6_MONTHS" ? "6 Months"
        : formData.contractDuration === "1_YEAR" ? "1 Year"
        : formData.contractDuration === "2_YEARS" ? "2 Years"
        : formData.contractDuration === "INDEFINITE" ? "Indefinite"
        : formData.contractDuration === "CUSTOM" ? "Custom"
        : undefined },
    { label: "End Date", value: formData.contractDuration === "INDEFINITE" ? "—"
        : formData.contractDuration === "CUSTOM" ? formData.endDate
        : formData.startDate && formData.contractDuration ? (() => {
            const s = new Date(formData.startDate);
            if (formData.contractDuration === "6_MONTHS") s.setMonth(s.getMonth() + 6);
            else if (formData.contractDuration === "1_YEAR") s.setFullYear(s.getFullYear() + 1);
            else if (formData.contractDuration === "2_YEARS") s.setFullYear(s.getFullYear() + 2);
            return s.toLocaleDateString("vi-VN");
          })()
        : undefined },
    {
      label: "Base Salary",
      value: formData.baseSalary ? `${formData.baseSalary.toLocaleString()} VND` : undefined,
      sub: salaryInWords || undefined,
    },
  ];

  return (
    <div className="mt-2 rounded-xl border border-border-light bg-gray-50 p-4 space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">
        Information Summary
      </p>
      {items.map(({ label, value, sub }) => (
        <div key={label}>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-text-secondary-light font-medium flex-shrink-0">
              {label}
            </span>
            <span className="text-xs font-semibold text-text-primary-light text-right truncate max-w-[200px]">
              {value || <span className="text-text-muted-light font-normal">—</span>}
            </span>
          </div>
          {sub && (
            <p className="text-right text-[11px] italic text-text-secondary-light mt-0.5">
              {sub}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

// =======================
// Main Component
// =======================

const EmploymentDetailsForm: React.FC<EmploymentDetailsFormProps> = ({
  formData,
  setFormData,
  jobId,
  fieldErrors,
  clearFieldError,
  onFileChange,
  contractFileName,
}) => {
  const { departments, positions, loading, fetchError } = useEmploymentData();
  const { jobAutoFilled } = useJobAutoFill(jobId, loading, departments, positions, setFormData);
  usePositionDepartmentSync(positions, departments, formData, setFormData);

  // Position is locked when it was auto-filled from the Job table
  const isPosLocked = jobAutoFilled && !!formData.positionId;

  // Department is locked when position has a known department
  const selectedPos = positions.find((p) => p.id === formData.positionId);
  const isDeptLocked = !!selectedPos?.deptId;
  
  const update = (field: keyof CreateNewHireDTO, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field as string);
  };

  const sharedProps = { formData, fieldErrors, update };

  return (
    <div className="space-y-5">
      {fetchError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          <ErrorIcon />
          {fetchError}
        </div>
      )}

      <ProfessionInfoSection
        {...sharedProps}
        departments={departments}
        positions={positions}
        loading={loading}
        fetchError={fetchError}
        isDeptLocked={isDeptLocked}
        isPosLocked={isPosLocked}
      />

      <ContractSection {...sharedProps} onFileChange={onFileChange} contractFileName={contractFileName} />

      <InformationSummarySection
        formData={formData}
        departments={departments}
        positions={positions}
      />
    </div>
  );
};

export default EmploymentDetailsForm;
