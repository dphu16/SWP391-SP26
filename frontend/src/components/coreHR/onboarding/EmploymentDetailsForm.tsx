import React, { useState, useEffect } from "react";
import apiClient from "../../../services/apiClient";
import {
  inputCls,
  labelCls,
  SelectWrapper,
  SkeletonSelect,
  ErrorIcon,
} from "./formConstants";
import type { CreateNewHireDTO } from "../hooks/types";

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

  const update = (field: keyof CreateNewHireDTO, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-5">
      {/* Error */}
      {fetchError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          <ErrorIcon />
          {fetchError}
        </div>
      )}

      {/* Department + Position */}
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
                onChange={(e) => update("positionId", e.target.value)}
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

      {/* Manager ID + Joining Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Mentor ID</label>
          <input
            type="text"
            value={formData.managerId ?? ""}
            onChange={(e) => update("managerId", e.target.value)}
            placeholder="e.g. UUID of manager"
            className={`${inputCls} font-mono`}
          />
        </div>
        <div>
          <label className={labelCls}>Joining Date</label>
          <input
            type="date"
            value={formData.dateOfJoining ?? ""}
            onChange={(e) => update("dateOfJoining", e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {/* Role + Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>
            Role <span className="text-rose-500">*</span>
          </label>
          <SelectWrapper>
            <select
              value={formData.role}
              onChange={(e) => update("role", e.target.value)}
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
              onChange={(e) => update("status", e.target.value)}
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

      {/* Contract Number + Contract Type */}
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
          <label className={labelCls}>Contract Type</label>
          <SelectWrapper>
            <select
              value={formData.contractType ?? ""}
              onChange={(e) => update("contractType", e.target.value)}
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

      {/* Start Date + End Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Start Date</label>
          <input
            type="date"
            value={formData.startDate ?? ""}
            onChange={(e) => update("startDate", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>End Date</label>
          <input
            type="date"
            value={formData.endDate ?? ""}
            onChange={(e) => update("endDate", e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {/* Base Salary */}
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

export default EmploymentDetailsForm;
