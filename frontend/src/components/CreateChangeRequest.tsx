import React, { useState } from "react";
import { useToast } from "./ui/Toast";
import {
  createChangeRequest,
  type ChangeRequestCreateDTO,
} from "../services/changeRequestService";

type RequestType = "" | "TAX_CODE" |"CITIZEN_ID";

interface FormData {
  requestType: RequestType;
  title: string;
  content: string;
  citizenId: string;
  taxCode: string;

}

interface FormErrors {
  requestType?: string;
  title?: string;
  content?: string;
  citizenId?: string;
  taxCode?: string;

}


const INITIAL_FORM: FormData = {
  requestType: "",
  title: "",
  content: "",
  citizenId: "",
  taxCode: "",
};

const REQUEST_TYPES: { value: RequestType; label: string; description: string }[] = [
  { value: "TAX_CODE", label: "Tax Code", description: "Update tax code" },
  { value: "CITIZEN_ID",       label: "Citizen ID",      description: "Update citizen ID" },
];



const AlertCircleIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const SpinnerIcon: React.FC = () => (
  <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const SendIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
    <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════════════
   REUSABLE FORM FIELD COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

interface FieldWrapperProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}

const FieldWrapper: React.FC<FieldWrapperProps> = ({ id, label, required, error, children, hint }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark select-none">
      {label}
      {required && <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>}
    </label>
    {children}
    {hint && !error && (
      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{hint}</p>
    )}
    {error && (
      <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-xs text-rose-500 font-medium animate-fade-in">
        <AlertCircleIcon />
        {error}
      </p>
    )}
  </div>
);

const inputBaseClass = [
  "w-full px-4 py-2.5",
  "rounded-xl border",
  "bg-surface-light dark:bg-surface-dark",
  "text-sm text-text-primary-light dark:text-text-primary-dark",
  "placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark",
  "transition-all duration-200",
  "outline-none",
  "disabled:opacity-50 disabled:cursor-not-allowed",
].join(" ");

const inputNormalBorder = "border-border-light dark:border-border-dark focus:border-primary focus:ring-2 focus:ring-primary/20";
const inputErrorBorder  = "border-rose-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20";


/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

const CreateChangeRequest: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ── Field change handler ────────────────────────────────────────────── */
  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  /* ── Validation ──────────────────────────────────────────────────────── */
  const validate = (): boolean => {
    const next: FormErrors = {};
    let valid = true;

    if (!form.requestType) {
      next.requestType = "Please select a request type.";
      valid = false;
    }
    if (!form.title.trim()) {
      next.title = "Title is required.";
      valid = false;
    }
    if (!form.content.trim()) {
      next.content = "Content is required.";
      valid = false;
    }

    if (form.requestType === "TAX_CODE") {
      if (form.taxCode && !/^\d{10}(-\d{3})?$/.test(form.taxCode)) {
        next.taxCode = "Invalid tax code format.";
        valid = false;
      }
    }

    if (form.requestType === "CITIZEN_ID") {
      if (form.citizenId && !/^\d{9,12}$/.test(form.citizenId)) {
        next.citizenId = "Citizen ID must be 9-12 digits.";
        valid = false;
      }
    }

    setErrors(next);
    return valid;
  };


  /* ── Submit ──────────────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Build the DTO matching backend ChangeRequestCreateDTO
      const dto: ChangeRequestCreateDTO = {};
      if (form.citizenId)     dto.citizenId = form.citizenId;
      if (form.taxCode)       dto.taxCode = form.taxCode;


      // TODO: Replace with real employee ID from auth context/JWT
      const employeeId = "00000000-0000-0000-0000-000000000000";

      await createChangeRequest(employeeId, dto);

      success("Request Submitted", "Your change request has been created and is pending review.");

      // Reset form
      setForm(INITIAL_FORM);
      setErrors({});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit request. Please try again.";
      toastError("Submission Failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Render helper: conditional fields based on request type ──────── */
  const renderDynamicFields = () => {
    if (!form.requestType) return null;

    switch (form.requestType) {
      case "TAX_CODE":
        return (
          <FieldWrapper id="cr-taxCode" label="Tax Code" error={errors.taxCode} hint="10 digits, optionally followed by -XXX">
              <input
                id="cr-taxCode"
                type="text"
                value={form.taxCode}
                onChange={(e) => handleChange("taxCode", e.target.value)}
                placeholder="e.g. 0123456789"
                disabled={isSubmitting}
                aria-invalid={!!errors.taxCode}
                aria-describedby={errors.taxCode ? "cr-taxCode-error" : undefined}
                className={`${inputBaseClass} ${errors.taxCode ? inputErrorBorder : inputNormalBorder}`}
              />
            </FieldWrapper>
  )

      case "CITIZEN_ID":
        return (
          <>
            <FieldWrapper id="cr-citizenId" label="Citizen ID" error={errors.citizenId} hint="9–12 digits">
              <input
                id="cr-citizenId"
                type="text"
                value={form.citizenId}
                onChange={(e) => handleChange("citizenId", e.target.value)}
                placeholder="e.g. 012345678901"
                disabled={isSubmitting}
                aria-invalid={!!errors.citizenId}
                aria-describedby={errors.citizenId ? "cr-citizenId-error" : undefined}
                className={`${inputBaseClass} ${errors.citizenId ? inputErrorBorder : inputNormalBorder}`}
              />
            </FieldWrapper>
            
          </>
        );

      default:
        return null;
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════ */
  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Create Change Request" className="space-y-6">

      {/* ── Two-column grid (desktop) / single-column (mobile) ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Left Column: Basic Info ────────────────────────────────────── */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-primary" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <path d="M14 2v6h6" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
              </svg>
            </div>
            <h2 className="text-base font-heading font-semibold text-text-primary-light dark:text-text-primary-dark">
              Request Information
            </h2>
          </div>

          {/* Request Type */}
          <FieldWrapper id="cr-type" label="Request Type" required error={errors.requestType}>
            <div className="relative">
              <select
                id="cr-type"
                value={form.requestType}
                onChange={(e) => handleChange("requestType", e.target.value as RequestType)}
                disabled={isSubmitting}
                aria-invalid={!!errors.requestType}
                aria-describedby={errors.requestType ? "cr-type-error" : undefined}
                className={`${inputBaseClass} appearance-none pr-10 cursor-pointer ${errors.requestType ? inputErrorBorder : inputNormalBorder}`}
              >
                <option value="" disabled>Select a type…</option>
                {REQUEST_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary-light dark:text-text-secondary-dark">
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </FieldWrapper>

          {/* Selected type badge */}
          {form.requestType && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <span className="text-xs font-medium text-primary">
                {REQUEST_TYPES.find((t) => t.value === form.requestType)?.description}
              </span>
            </div>
          )}

          {/* Title */}
          <FieldWrapper id="cr-title" label="Title" required error={errors.title}>
            <input
              id="cr-title"
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Brief summary of your request…"
              disabled={isSubmitting}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "cr-title-error" : undefined}
              className={`${inputBaseClass} ${errors.title ? inputErrorBorder : inputNormalBorder}`}
            />
          </FieldWrapper>

          {/* Content */}
          <FieldWrapper id="cr-content" label="Content" required error={errors.content}>
            <textarea
              id="cr-content"
              rows={5}
              value={form.content}
              onChange={(e) => handleChange("content", e.target.value)}
              placeholder="Describe the changes you'd like to request…"
              disabled={isSubmitting}
              aria-invalid={!!errors.content}
              aria-describedby={errors.content ? "cr-content-error" : undefined}
              className={`${inputBaseClass} ${errors.content ? inputErrorBorder : inputNormalBorder} resize-none`}
            />
          </FieldWrapper>
        </div>

        {/* ── Right Column: Dynamic Fields + File Upload ──────────────── */}
        <div className="space-y-6">

          {/* Dynamic fields card */}
          {form.requestType && (
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-6 space-y-5 shadow-xs animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-accent-purple" aria-hidden="true">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </div>
                <h2 className="text-base font-heading font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Change Details
                </h2>
              </div>

              {renderDynamicFields()}
            </div>
          )}
        </div>
      </div>

      {/* ── Submit Row ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => { setForm(INITIAL_FORM); setErrors({}); }}
          disabled={isSubmitting}
          className={[
            "px-5 py-2.5 rounded-xl border",
            "text-sm font-semibold",
            "border-border-light dark:border-border-dark",
            "text-text-primary-light dark:text-text-primary-dark",
            "bg-surface-light dark:bg-surface-dark",
            "hover:bg-surface-2-light dark:hover:bg-surface-2-dark",
            "transition-colors duration-200 cursor-pointer",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          ].join(" ")}
        >
          Reset
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className={[
            "flex items-center gap-2 px-6 py-2.5 rounded-xl",
            "text-sm font-semibold text-white",
            "bg-primary hover:bg-primary-hover",
            "shadow-sm hover:shadow-md",
            "transition-all duration-200 cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            "active:scale-[0.98]",
            "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:hover:shadow-sm disabled:active:scale-100",
          ].join(" ")}
        >
          {isSubmitting ? (
            <>
              <SpinnerIcon />
              <span>Submitting…</span>
            </>
          ) : (
            <>
              <SendIcon />
              <span>Submit Request</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CreateChangeRequest;
