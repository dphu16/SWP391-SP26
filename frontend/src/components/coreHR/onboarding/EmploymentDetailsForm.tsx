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

import { useEmploymentData, useJobAutoFill, type DepartmentOption, type PositionOption } from "./hooks/useEmploymentData";
import { useManagerSearch, type ManagerOption } from "./hooks/useManagerSearch";

interface EmploymentDetailsFormProps {
  formData: CreateNewHireDTO;
  setFormData: React.Dispatch<React.SetStateAction<CreateNewHireDTO>>;
  jobId?: string;
  fieldErrors: FieldErrors;
  clearFieldError: (field: string) => void;
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

const DepartmentPositionSection: React.FC<SharedProps & {
  departments: DepartmentOption[];
  positions: PositionOption[];
  loading: boolean;
  fetchError: string | null;
}> = ({ formData, fieldErrors, update, departments, positions, loading, fetchError }) => (
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
            onChange={(e) => update("departmentId", e.target.value)}
            disabled={!!fetchError}
            className={`${inputCls} appearance-none pr-9 cursor-pointer ${errorBorder(fieldErrors, "departmentId")}`}
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
            disabled={!!fetchError}
            className={`${inputCls} appearance-none pr-9 cursor-pointer ${errorBorder(fieldErrors, "positionId")}`}
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
  </div>
);

const ManagerDateSection: React.FC<SharedProps & {
  managerQuery: string;
  handleManagerQueryChange: (v: string) => void;
  managerResults: ManagerOption[];
  setShowManagerDropdown: (b: boolean) => void;
  selectedManagerName: string;
  managerSearching: boolean;
  showManagerDropdown: boolean;
  handleSelectManager: (m: ManagerOption) => void;
  managerRef: React.RefObject<HTMLDivElement | null>;
}> = ({
  formData, fieldErrors, update,
  managerQuery, handleManagerQueryChange, managerResults, setShowManagerDropdown,
  selectedManagerName, managerSearching, showManagerDropdown, handleSelectManager, managerRef
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div ref={managerRef as React.RefObject<HTMLDivElement>} className="relative">
      <label className={labelCls}>Manager</label>
      <input
        type="text"
        value={managerQuery}
        onChange={(e) => handleManagerQueryChange(e.target.value)}
        onFocus={() => {
          if (managerResults.length > 0) setShowManagerDropdown(true);
        }}
        placeholder="Search by name or employee code…"
        className={`${inputCls} ${errorBorder(fieldErrors, "managerId")}`}
      />
      {selectedManagerName && (
        <p className="mt-1 text-xs text-emerald-600 font-medium">✓ {selectedManagerName}</p>
      )}
      {managerSearching && (
        <p className="mt-1 text-xs text-text-muted-light">Searching…</p>
      )}
      {showManagerDropdown && managerResults.length > 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border-light bg-white shadow-lg">
          {managerResults.map((mgr) => (
            <button
              key={mgr.id}
              type="button"
              onClick={() => handleSelectManager(mgr)}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-border-light last:border-0 cursor-pointer"
            >
              <span className="text-sm font-semibold text-text-primary-light">{mgr.fullName}</span>
              <span className="ml-2 text-xs text-text-secondary-light font-mono">{mgr.employeeCode}</span>
              <span className="block text-[11px] text-text-muted-light">
                {mgr.positionTitle} — {mgr.deptName}
              </span>
            </button>
          ))}
        </div>
      )}
      {showManagerDropdown && managerResults.length === 0 && !managerSearching && managerQuery.trim().length >= 2 && (
        <div className="absolute z-20 left-0 right-0 mt-1 rounded-xl border border-border-light bg-white shadow-lg px-4 py-3">
          <p className="text-xs text-text-muted-light">No results found</p>
        </div>
      )}
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

const RoleStatusSection: React.FC<SharedProps> = ({ formData, fieldErrors, update }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className={labelCls}>
        Role <span className="text-rose-500">*</span>
      </label>
      <SelectWrapper>
        <select
          value={formData.role}
          onChange={(e) => update("role", e.target.value)}
          className={`${inputCls} appearance-none pr-9 cursor-pointer ${errorBorder(fieldErrors, "role")}`}
        >
          <option value="ROLE_EMPLOYEE">Employee</option>
          <option value="ROLE_HR">HR</option>
          <option value="ROLE_FINANCE">Finance</option>
        </select>
      </SelectWrapper>
      <FieldError message={fieldErrors.role} />
    </div>

    <div>
      <label className={labelCls}>
        Status <span className="text-rose-500">*</span>
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
  </div>
);

const ContractSection: React.FC<SharedProps> = ({ formData, fieldErrors, update }) => (
  <>
    <div className="pt-1 pb-2 border-b border-border-light">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">
        Contract Information
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          Contract Type <span className="text-rose-500">*</span>
        </label>
        <SelectWrapper>
          <select
            value={formData.contractType ?? ""}
            onChange={(e) => update("contractType", e.target.value)}
            className={`${inputCls} appearance-none pr-9 cursor-pointer ${errorBorder(fieldErrors, "contractType")}`}
          >
            <option value="" disabled>Select type…</option>
            <option value="PROBATION">Probation</option>
            <option value="DEFINITE">Definite</option>
            <option value="INDEFINITE">Indefinite</option>
          </select>
        </SelectWrapper>
        <FieldError message={fieldErrors.contractType} />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <label className={labelCls}>End Date</label>
        <input
          type="date"
          value={formData.endDate ?? ""}
          onChange={(e) => update("endDate", e.target.value)}
          className={`${inputCls} ${errorBorder(fieldErrors, "endDate")}`}
        />
        <FieldError message={fieldErrors.endDate} />
      </div>
    </div>
  </>
);

const SalarySection: React.FC<SharedProps> = ({ formData, fieldErrors, update }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className={labelCls}>
        Base Salary <span className="text-rose-500">*</span>
      </label>
      <input
        type="number"
        value={formData.baseSalary}
        onChange={(e) => update("baseSalary", parseFloat(e.target.value) || 0)}
        placeholder="e.g. 15000000"
        className={`${inputCls} font-mono ${errorBorder(fieldErrors, "baseSalary")}`}
      />
      <FieldError message={fieldErrors.baseSalary} />
    </div>
  </div>
);

const InformationSummarySection: React.FC<{
  formData: CreateNewHireDTO;
  departments: DepartmentOption[];
  positions: PositionOption[];
  selectedManagerName: string;
}> = ({ formData, departments, positions, selectedManagerName }) => {
  const salaryInWords = numberToVietnameseWords(formData.baseSalary);
  
  const items = [
    { label: "Full Name", value: formData.fullName },
    { label: "Email", value: formData.email },
    { label: "Phone Number", value: formData.phone },
    { label: "Department", value: departments.find((d) => d.id === formData.departmentId)?.name },
    { label: "Position", value: positions.find((p) => p.id === formData.positionId)?.title },
    { label: "Manager", value: selectedManagerName || undefined },
    { label: "Role", value: formData.role },
    { label: "Status", value: formData.status },
    { label: "Contract Number", value: formData.contractNumber },
    { label: "Contract Type", value: formData.contractType },
    { label: "Start Date", value: formData.startDate },
    { label: "End Date", value: formData.endDate },
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
}) => {
  const { departments, positions, loading, fetchError } = useEmploymentData();
  useJobAutoFill(jobId, loading, departments, positions, setFormData);
  
  const managerSearchProps = useManagerSearch(setFormData, clearFieldError);

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

      <DepartmentPositionSection
        {...sharedProps}
        departments={departments}
        positions={positions}
        loading={loading}
        fetchError={fetchError}
      />

      <ManagerDateSection
        {...sharedProps}
        {...managerSearchProps}
      />

      <RoleStatusSection {...sharedProps} />

      <ContractSection {...sharedProps} />

      <SalarySection {...sharedProps} />

      <InformationSummarySection
        formData={formData}
        departments={departments}
        positions={positions}
        selectedManagerName={managerSearchProps.selectedManagerName}
      />
    </div>
  );
};

export default EmploymentDetailsForm;
