import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../services/apiClient";
import type { CreateNewHireDTO } from "../types";

const API_URL = "/api/employees/new";
const DRAFT_KEY = "candidate_profile_draft";

// ── Types ─────────────────────────────────────────────────────────────────────
interface NewHireCredentials { username: string; rawPassword: string; fullName: string; }
interface LookupOption { id: string; name?: string; title?: string; fullName?: string; deptName?: string; deptId?: string; }

// ── Styles ────────────────────────────────────────────────────────────────────
const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-gray-900 text-text-primary-light dark:text-text-primary-dark placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
const labelCls = "block text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-1.5";

// ── Icons ─────────────────────────────────────────────────────────────────────
const CheckIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" clipRule="evenodd" /></svg>;
const XIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" /></svg>;
const CopyIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z" /><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z" /></svg>;
const ArrowRightIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.22 2.97a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06l2.97-2.97H3.75a.75.75 0 010-1.5h7.44L8.22 4.03a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>;
const ArrowLeftIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z" clipRule="evenodd" /></svg>;
const ChevronRightIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>;
const SaveIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M2.75 14A1.75 1.75 0 011 12.25v-8.5C1 2.784 1.784 2 2.75 2h8.5c.464 0 .909.184 1.237.513l1.5 1.5c.329.328.513.773.513 1.237v7a1.75 1.75 0 01-1.75 1.75h-10zM2.5 12.25c0 .138.112.25.25.25h10a.25.25 0 00.25-.25v-7a.25.25 0 00-.073-.177l-1.5-1.5a.25.25 0 00-.177-.073H2.75a.25.25 0 00-.25.25v8.5zM5 4.75A.75.75 0 015.75 4h4.5a.75.75 0 010 1.5h-4.5A.75.75 0 015 4.75z" /></svg>;
const ShieldCheckIcon = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.425c.069.52.104 1.05.104 1.589 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 01-.332 0C5.26 16.563 2 12.162 2 7c0-.538.035-1.069.104-1.589a.5.5 0 01.48-.425 11.947 11.947 0 007.077-2.749zm4.196 5.954a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>;
const WarningIcon = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
const PersonIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark flex-shrink-0"><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2-3a2 2 0 11-4 0 2 2 0 014 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.029 10 8 10c-2.029 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" /></svg>;
const KeyIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark flex-shrink-0"><path fillRule="evenodd" d="M6.5 0a6.5 6.5 0 105.478 9.984l.544.544a1.5 1.5 0 001.06.44h.418a1.5 1.5 0 001.5-1.5v-.418a1.5 1.5 0 00-.44-1.06l-.544-.544A6.5 6.5 0 006.5 0zm-5 6.5a5 5 0 1110 0 5 5 0 01-10 0zm4.5 0a.5.5 0 11-1 0 .5.5 0 011 0z" clipRule="evenodd" /></svg>;
const VerifiedIcon = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>;
const ErrorIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path fillRule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm0-11a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 018 4zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
const DraftIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M11.013 1.427a1.75 1.75 0 012.474 2.474L6.226 11.162l-2.862.677a.25.25 0 01-.302-.303l.677-2.861 7.274-7.248zM1.75 13.5a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H1.75z" clipRule="evenodd" /></svg>;

// ── Chevron select ────────────────────────────────────────────────────────────
const SelectWrapper: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, className, ...props }) => (
  <div className="relative">
    <select className={`${inputCls} appearance-none pr-9 cursor-pointer ${className ?? ""}`} {...props}>{children}</select>
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>
    </span>
  </div>
);

const SkeletonInput = () => <div className="h-[42px] rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />;

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast: React.FC<{ message: string; type: "success" | "error" | "info"; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const cls = type === "success"
    ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200"
    : type === "info"
      ? "bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-700 text-sky-800 dark:text-sky-200"
      : "bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-200";
  return (
    <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-lg border max-w-sm ${cls}`}>
      <p className="text-sm font-semibold flex-1">{message}</p>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"><XIcon /></button>
    </div>
  );
};

// ── Credentials Modal ─────────────────────────────────────────────────────────
const CredentialsModal: React.FC<{ credentials: NewHireCredentials; onClose: () => void }> = ({ credentials, onClose }) => {
  const [pwCopied, setPwCopied] = useState(false);
  const [unCopied, setUnCopied] = useState(false);
  const copy = async (text: string, done: () => void) => {
    try { await navigator.clipboard.writeText(text); } catch { /* fallback */ }
    done();
  };
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-2xl shadow-lg border border-border-light dark:border-border-dark overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-emerald-500 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white"><ShieldCheckIcon /></div>
          <div>
            <h2 className="text-base font-bold text-white">Employee Created!</h2>
            <p className="text-emerald-100 text-xs mt-0.5">{credentials.fullName} has been successfully onboarded.</p>
          </div>
        </div>
        <div className="mx-6 mt-5 flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
          <span className="text-amber-500 flex-shrink-0 mt-0.5"><WarningIcon /></span>
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200 leading-relaxed"><strong>Important:</strong> Copy credentials now. The password will <strong>not</strong> be shown again.</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { label: "Username", value: credentials.username, icon: <PersonIcon />, copied: unCopied, onCopy: () => copy(credentials.username, () => { setUnCopied(true); setTimeout(() => setUnCopied(false), 2500); }) },
            { label: "Temporary Password", value: credentials.rawPassword, icon: <KeyIcon />, copied: pwCopied, onCopy: () => copy(credentials.rawPassword, () => { setPwCopied(true); setTimeout(() => setPwCopied(false), 2500); }) },
          ].map(({ label, value, icon, copied, onCopy }) => (
            <div key={label}>
              <label className={labelCls}>{label}</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-3 bg-gray-50 dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-xl px-4 py-3">
                  {icon}
                  <span className="font-mono text-sm font-semibold text-text-primary-light dark:text-text-primary-dark flex-1 select-all">{value}</span>
                </div>
                <button onClick={onCopy} className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${copied ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 text-emerald-600" : "bg-white dark:bg-gray-800 border-border-light dark:border-border-dark text-text-secondary-light hover:text-primary"}`}>
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer btn-primary-action">
            <ArrowRightIcon /> Done — Go to Onboarding
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Steps ─────────────────────────────────────────────────────────────────────
const steps = [
  { id: 0, title: "Personal Info", description: "Basic personal details" },
  { id: 1, title: "Employment", description: "Department, position & manager" },
  { id: 2, title: "Legal & Tax", description: "Citizen ID, tax code & address" },
  { id: 3, title: "Dependent & Salary", description: "Emergency contact & compensation" },
];

// ── Step 0: Personal Info ─────────────────────────────────────────────────────
const PersonalInfoForm: React.FC<{ formData: CreateNewHireDTO; setFormData: React.Dispatch<React.SetStateAction<CreateNewHireDTO>> }> = ({ formData, setFormData }) => {
  const set = (key: keyof CreateNewHireDTO) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData(prev => ({ ...prev, [key]: e.target.value }));
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">Personal Information</h1>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">Ensure all personal details are accurate and up to date.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Full Name <span className="text-rose-500">*</span></label>
          <input type="text" value={formData.fullName} onChange={set("fullName")} placeholder="e.g. Nguyen Van A" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Email Address <span className="text-rose-500">*</span></label>
          <input type="email" value={formData.email} onChange={set("email")} placeholder="e.g. name@company.com" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Phone Number</label>
          <input type="tel" value={formData.phone} onChange={set("phone")} placeholder="e.g. 0901234567" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Date of Birth</label>
          <input type="date" value={formData.dateOfBirth} onChange={set("dateOfBirth")} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Gender</label>
          <SelectWrapper value={formData.gender} onChange={set("gender")}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </SelectWrapper>
        </div>
      </div>
    </div>
  );
};

// ── Step 1: Employment Details ────────────────────────────────────────────────
const EmploymentDetailsForm: React.FC<{ formData: CreateNewHireDTO; setFormData: React.Dispatch<React.SetStateAction<CreateNewHireDTO>> }> = ({ formData, setFormData }) => {
  const [departments, setDepartments] = useState<LookupOption[]>([]);
  const [allPositions, setAllPositions] = useState<LookupOption[]>([]);
  const [managers, setManagers] = useState<LookupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiClient.get<LookupOption[]>("/api/lookup/departments"),
      apiClient.get<LookupOption[]>("/api/lookup/positions"),
      apiClient.get<LookupOption[]>("/api/lookup/managers"),
    ])
      .then(([d, p, m]) => {
        if (cancelled) return;
        setDepartments(d.data);
        setAllPositions(p.data);
        setManagers(m.data);
      })
      .catch(() => { if (!cancelled) setFetchError("Failed to load lookup data. Please refresh."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Positions filtered by selected department
  const filteredPositions = formData.departmentId
    ? allPositions.filter(p => p.deptId === formData.departmentId)
    : [];

  const set = (key: keyof CreateNewHireDTO) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [key]: e.target.value }));

  // Reset positionId when department changes to avoid stale selection
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, departmentId: e.target.value, positionId: "" }));
  };

  const noDept = !formData.departmentId;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">Employment Details</h1>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">Assign department, position and direct manager.</p>
      </div>
      {fetchError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-300 text-sm font-medium">
          <ErrorIcon />{fetchError}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Department */}
        <div>
          <label className={labelCls}>Department <span className="text-rose-500">*</span></label>
          {loading ? <SkeletonInput /> : (
            <SelectWrapper value={formData.departmentId} onChange={handleDepartmentChange} disabled={!!fetchError}>
              <option value="" disabled>Select department…</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </SelectWrapper>
          )}
        </div>
        {/* Position — filtered by selected department */}
        <div>
          <label className={labelCls}>Position <span className="text-rose-500">*</span></label>
          {loading ? <SkeletonInput /> : (
            <>
              <SelectWrapper
                value={formData.positionId}
                onChange={set("positionId")}
                disabled={!!fetchError || noDept}
              >
                <option value="" disabled>
                  {noDept ? "Select a department first…"
                    : filteredPositions.length === 0 ? "No positions in this department"
                    : "Select position…"}
                </option>
                {filteredPositions.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </SelectWrapper>
              {noDept && (
                <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  ℹ️ Please select a department first
                </p>
              )}
              {!noDept && filteredPositions.length === 0 && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                  No positions assigned to this department yet.
                </p>
              )}
            </>
          )}
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Direct Manager</label>
          {loading ? <SkeletonInput /> : (
            <SelectWrapper value={formData.managerId ?? ""} onChange={set("managerId")} disabled={!!fetchError}>
              <option value="">— No manager assigned —</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.fullName}{m.deptName ? ` (${m.deptName})` : ""}
                </option>
              ))}
            </SelectWrapper>
          )}
          <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark mt-1.5">Only employees with MANAGER role are listed.</p>
        </div>
      </div>
    </div>
  );
};

// ── Step 2: Legal & Tax (merged) ──────────────────────────────────────────────
const LegalTaxForm: React.FC<{ formData: CreateNewHireDTO; setFormData: React.Dispatch<React.SetStateAction<CreateNewHireDTO>> }> = ({ formData, setFormData }) => {
  const set = (key: keyof CreateNewHireDTO) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData(prev => ({ ...prev, [key]: e.target.value }));
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">Legal & Tax Information</h1>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">Required for background check, payroll and legal compliance.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Citizen ID Number</label>
          <input type="text" value={formData.citizenId} onChange={set("citizenId")} placeholder="e.g. 001234567890" className={`${inputCls} font-mono`} />
          <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark mt-1.5">12-digit government-issued ID number.</p>
        </div>
        <div>
          <label className={labelCls}>Personal Tax ID (MST)</label>
          <input type="text" value={formData.taxCode} onChange={set("taxCode")} placeholder="e.g. 0987654321" className={`${inputCls} font-mono`} />
          <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark mt-1.5">10-digit tax code for payroll compliance.</p>
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Permanent Home Address</label>
          <input type="text" value={formData.address} onChange={set("address")} placeholder="e.g. 123 Nguyen Hue, District 1, Ho Chi Minh City" className={inputCls} />
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 p-4">
        <p className="text-xs font-semibold text-sky-700 dark:text-sky-300 mb-2">Why do we collect this?</p>
        <ul className="space-y-1">
          {["Citizen ID is required for background verification and contract signing.", "Tax code is used to calculate personal income tax deductions correctly.", "Address is used for official correspondence and records."].map(t => (
            <li key={t} className="flex items-start gap-2 text-xs text-sky-600 dark:text-sky-400">
              <span className="mt-0.5 flex-shrink-0 text-sky-400"><CheckIcon /></span>{t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// ── Step 3: Dependent & Salary ────────────────────────────────────────────────
const DependentSalaryForm: React.FC<{ formData: CreateNewHireDTO; setFormData: React.Dispatch<React.SetStateAction<CreateNewHireDTO>> }> = ({ formData, setFormData }) => {
  const set = (key: keyof CreateNewHireDTO) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData(prev => ({ ...prev, [key]: e.target.value }));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">Dependent & Salary</h1>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">Emergency contact information and initial compensation range.</p>
      </div>

      {/* Dependent section */}
      <div className="rounded-xl border border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-900/50 p-5 space-y-4">
        <p className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-text-secondary-light"><path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 100-6 3 3 0 000 6z" /></svg>
          Emergency / Dependent Contact
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Dependent Full Name</label>
            <input type="text" value={formData.dependentName ?? ""} onChange={set("dependentName")} placeholder="e.g. Nguyen Thi B" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Relationship</label>
            <SelectWrapper value={formData.relationship ?? ""} onChange={set("relationship")}>
              <option value="">— Select relationship —</option>
              <option value="SPOUSE">Spouse (Vợ / Chồng)</option>
              <option value="PARENT">Parent (Bố / Mẹ)</option>
              <option value="CHILD">Child (Con)</option>
              <option value="SIBLING">Sibling (Anh / Chị / Em)</option>
              <option value="OTHER">Other</option>
            </SelectWrapper>
          </div>
        </div>
        <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">Optional — used for emergency contact and tax deduction records.</p>
      </div>

      {/* Salary section */}
      <div className="rounded-xl border border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-900/50 p-5 space-y-4">
        <p className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-text-secondary-light"><path d="M1 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H2a1 1 0 01-1-1v-2zm5 1a1 1 0 000 2h.01a1 1 0 000-2H6zm4 0a1 1 0 000 2h1a1 1 0 000-2h-1z" /></svg>
          Base Salary Range (VNĐ) <span className="text-rose-500 font-normal">*</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Minimum Salary <span className="text-rose-500">*</span></label>
            <div className="relative">
              <input type="number" min="0" step="500000" value={formData.baseSalaryMin} onChange={set("baseSalaryMin")} placeholder="e.g. 8000000" className={`${inputCls} pr-14`} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">VNĐ</span>
            </div>
          </div>
          <div>
            <label className={labelCls}>Maximum Salary <span className="text-rose-500">*</span></label>
            <div className="relative">
              <input type="number" min="0" step="500000" value={formData.baseSalaryMax} onChange={set("baseSalaryMax")} placeholder="e.g. 12000000" className={`${inputCls} pr-14`} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">VNĐ</span>
            </div>
          </div>
        </div>
        {formData.baseSalaryMin && formData.baseSalaryMax && Number(formData.baseSalaryMax) < Number(formData.baseSalaryMin) && (
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1"><ErrorIcon /> Max salary must be ≥ Min salary.</p>
        )}
        <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">This range will be used for the initial labor contract. HR can adjust later.</p>
      </div>
    </div>
  );
};

// ── Default form state ────────────────────────────────────────────────────────
const makeDefault = (name: string, phone: string, email: string, appId?: string): CreateNewHireDTO => ({
  fullName: name, phone, email, gender: "MALE", address: "",
  departmentId: "", positionId: "", citizenId: "", taxCode: "", dateOfBirth: "",
  sourceApplicationId: appId, managerId: "", dependentName: "", relationship: "",
  baseSalaryMin: "", baseSalaryMax: "",
});

// ── Main Component ────────────────────────────────────────────────────────────
const CandidateProfileCompletion: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const candidateName = searchParams.get("name") || "";
  const candidateEmail = searchParams.get("email") || "";
  const candidatePhone = searchParams.get("phone") || "";
  const jobTitle = searchParams.get("job") || "";

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [credentials, setCredentials] = useState<NewHireCredentials | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);

  // Load draft from localStorage if available
  const [formData, setFormData] = useState<CreateNewHireDTO>(() => {
    const draftKey = `${DRAFT_KEY}_${applicationId ?? "new"}`;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) return JSON.parse(saved) as CreateNewHireDTO;
    } catch { /* ignore */ }
    return makeDefault(candidateName, candidatePhone, candidateEmail, applicationId);
  });

  const handleSaveDraft = useCallback(() => {
    const draftKey = `${DRAFT_KEY}_${applicationId ?? "new"}`;
    try {
      localStorage.setItem(draftKey, JSON.stringify(formData));
      setDraftSaved(true);
      setToast({ message: "Draft saved successfully! You can return to this form later.", type: "info" });
      setTimeout(() => setDraftSaved(false), 3000);
    } catch {
      setToast({ message: "Failed to save draft.", type: "error" });
    }
  }, [formData, applicationId]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      const response = await apiClient.post(API_URL, formData);
      const data = response.data;
      // Clear draft on success
      localStorage.removeItem(`${DRAFT_KEY}_${applicationId ?? "new"}`);
      setToast({ message: "Employee created successfully!", type: "success" });
      setCredentials({ username: data.username ?? "", rawPassword: data.rawPassword ?? "", fullName: data.fullName ?? formData.fullName });
    } catch (err: unknown) {
      const axErr = err as { response?: { status: number; statusText: string; data?: { message?: string } } };
      const message = axErr.response?.data?.message ?? `Error ${axErr.response?.status}: ${axErr.response?.statusText}`;
      setSubmitError(message);
      setToast({ message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = useCallback(() => {
    setCredentials(null);
    setFormData(makeDefault(candidateName, candidatePhone, candidateEmail, applicationId));
    setCurrentStep(0);
    navigate("/onboarding");
  }, [navigate, candidateName, candidatePhone, candidateEmail, applicationId]);

  const renderContent = () => {
    switch (currentStep) {
      case 0: return <PersonalInfoForm formData={formData} setFormData={setFormData} />;
      case 1: return <EmploymentDetailsForm formData={formData} setFormData={setFormData} />;
      case 2: return <LegalTaxForm formData={formData} setFormData={setFormData} />;
      case 3: return <DependentSalaryForm formData={formData} setFormData={setFormData} />;
      default: return <PersonalInfoForm formData={formData} setFormData={setFormData} />;
    }
  };

  const avatarColors = ["bg-primary/15 text-primary", "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400", "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"];
  const avatarColor = avatarColors[(formData.fullName?.charCodeAt(0) ?? 0) % avatarColors.length];
  const avatarInitials = formData.fullName?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const progressPct = Math.round((currentStep / steps.length) * 100);
  const isLastStep = currentStep === steps.length - 1;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {credentials && <CredentialsModal credentials={credentials} onClose={handleModalClose} />}

      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-text-secondary-light dark:text-text-secondary-dark">
          <button onClick={() => navigate("/onboarding")} className="hover:text-primary transition-colors cursor-pointer font-medium">Onboarding</button>
          <span className="text-text-muted-light dark:text-text-muted-dark"><ChevronRightIcon /></span>
          <span className="text-text-primary-light dark:text-text-primary-dark font-semibold truncate max-w-xs">{formData.fullName || "New Employee"} — Profile Completion</span>
        </nav>

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* ── Left Sidebar ── */}
            <div className="w-full lg:w-72 lg:flex-shrink-0 lg:sticky lg:top-6 flex flex-col gap-4">

              {/* Candidate Card */}
              <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-card overflow-hidden">
                <div className="h-14 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
                <div className="px-5 pb-5 -mt-7">
                  <div className="flex items-end gap-3 mb-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 ring-4 ring-surface-light dark:ring-surface-dark ${avatarColor}`}>{avatarInitials}</div>
                    <div className="pb-1">
                      <h2 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark leading-tight">{formData.fullName || "New Employee"}</h2>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">{jobTitle || "Onboarding"}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-text-secondary-light dark:text-text-secondary-dark">Profile Completion</span>
                      <span className="font-bold text-primary">{progressPct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>
                  {/* Quick info */}
                  <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark space-y-2">
                    {[{ label: "Email", value: formData.email }, { label: "Phone", value: formData.phone }].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">{label}</span>
                        <span className="text-xs font-medium text-text-primary-light dark:text-text-primary-dark truncate max-w-[130px]">{value || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-card overflow-hidden">
                <div className="px-4 py-3.5 border-b border-border-light dark:border-border-dark flex items-center gap-2">
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-primary"><path d="M2.5 3.5a.5.5 0 000 1h11a.5.5 0 000-1h-11zm0 4a.5.5 0 000 1h11a.5.5 0 000-1h-11zm0 4a.5.5 0 000 1h11a.5.5 0 000-1h-11z" /></svg>
                  <h3 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">Checklist</h3>
                  <span className="ml-auto text-[11px] font-semibold text-text-secondary-light dark:text-text-secondary-dark bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{currentStep}/{steps.length}</span>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
                  {steps.map((step, idx) => {
                    const isActive = currentStep === idx;
                    const isDone = currentStep > idx;
                    return (
                      <button key={step.id} onClick={() => setCurrentStep(idx)} className={`w-full text-left px-4 py-3.5 transition-colors flex items-center gap-3 cursor-pointer relative ${isActive ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/40"}`}>
                        {isActive && <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-r-full" />}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isDone ? "border-primary bg-primary text-white" : isActive ? "border-primary text-primary" : "border-gray-300 dark:border-gray-600"}`}>
                          {isDone ? <CheckIcon /> : isActive ? <div className="w-2 h-2 rounded-full bg-primary" /> : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs block truncate ${isActive ? "font-bold text-text-primary-light dark:text-text-primary-dark" : isDone ? "font-medium text-text-secondary-light dark:text-text-secondary-dark line-through decoration-gray-400" : "font-medium text-text-primary-light dark:text-text-primary-dark"}`}>{step.title}</span>
                          {isActive && <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark mt-0.5 truncate">{step.description}</p>}
                        </div>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md whitespace-nowrap ${isDone ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : isActive ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "bg-gray-100 dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark"}`}>
                          {isDone ? "Done" : isActive ? "Active" : "Pending"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {/* Submit CTA in sidebar */}
                <div className="p-4 border-t border-border-light dark:border-border-dark space-y-2">
                  <button
                    disabled={!isLastStep || submitting}
                    onClick={handleSubmit}
                    className={`w-full py-2.5 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm ${isLastStep ? "bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20 cursor-pointer btn-primary-action" : "bg-gray-100 dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark cursor-not-allowed"}`}
                  >
                    <VerifiedIcon />{submitting ? "Submitting…" : "Finish & Create Employee"}
                  </button>
                  {/* Save Draft in sidebar */}
                  <button onClick={handleSaveDraft} className={`w-full py-2 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm border transition-colors cursor-pointer ${draftSaved ? "border-emerald-400 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : "border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                    {draftSaved ? <><CheckIcon /> Draft Saved!</> : <><DraftIcon /> Save Draft</>}
                  </button>
                  <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark text-center">Complete all steps to enable submission</p>
                </div>
              </div>
            </div>

            {/* ── Right: Main Form ── */}
            <div className="flex-1 min-w-0">
              <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-card overflow-hidden">
                <div className="p-6 md:p-8 min-h-[520px]">
                  {renderContent()}
                  {submitError && (
                    <div className="mt-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 flex items-start gap-3">
                      <span className="text-rose-500 mt-0.5"><ErrorIcon /></span>
                      <p className="text-sm font-medium text-rose-800 dark:text-rose-200">{submitError}</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t border-border-light dark:border-border-dark flex items-center justify-between sticky bottom-0 z-10">
                  <button onClick={() => navigate("/onboarding")} className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors cursor-pointer">
                    Cancel
                  </button>
                  <div className="flex items-center gap-2">
                    {/* Save Draft button in footer */}
                    <button onClick={handleSaveDraft} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${draftSaved ? "border-emerald-400 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : "border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark"}`}>
                      {draftSaved ? <CheckIcon /> : <DraftIcon />}
                      {draftSaved ? "Saved!" : "Save Draft"}
                    </button>
                    {currentStep > 0 && (
                      <button onClick={() => setCurrentStep(s => s - 1)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-xl text-sm font-medium text-text-primary-light dark:text-text-primary-dark hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                        <ArrowLeftIcon /> Back
                      </button>
                    )}
                    {!isLastStep ? (
                      <button onClick={() => setCurrentStep(s => s + 1)} className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold shadow-sm shadow-primary/20 transition-all cursor-pointer btn-primary-action">
                        <SaveIcon /> Save & Continue
                      </button>
                    ) : (
                      <button onClick={handleSubmit} disabled={submitting} className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold shadow-sm shadow-primary/20 transition-all cursor-pointer btn-primary-action disabled:opacity-50 disabled:cursor-not-allowed">
                        {submitting ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <VerifiedIcon />}
                        {submitting ? "Submitting…" : "Complete & Create"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default CandidateProfileCompletion;
