import React from "react";
import { inputCls, labelCls, SelectWrapper } from "./formConstants";
import type { CreateNewHireDTO } from "../hooks/types";
import type { FieldErrors } from "../hooks/useCandidateOnboarding";

interface PersonalInfoFormProps {
  formData: CreateNewHireDTO;
  setFormData: React.Dispatch<React.SetStateAction<CreateNewHireDTO>>;
  fieldErrors: FieldErrors;
  clearFieldError: (field: string) => void;
}

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <p className="mt-1 text-xs text-rose-500 font-medium">{message}</p>
  ) : null;

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  formData,
  setFormData,
  fieldErrors,
  clearFieldError,
}) => {
  const update = (field: keyof CreateNewHireDTO, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const errorBorder = (field: string) =>
    fieldErrors[field] ? "border-rose-400 focus:ring-rose-300" : "";

  return (
    <div className="space-y-6">
      {/* Section: Basic Identity */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="md:col-span-2 lg:col-span-1">
          <label className={labelCls}>
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            placeholder="e.g. John Doe"
            className={`${inputCls} ${errorBorder("fullName")}`}
          />
          <FieldError message={fieldErrors.fullName} />
        </div>
        <div>
          <label className={labelCls}>Gender</label>
          <SelectWrapper>
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
          </SelectWrapper>
        </div>
        <div>
          <label className={labelCls}>
            Date of Birth <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => update("dateOfBirth", e.target.value)}
            className={`${inputCls} ${errorBorder("dateOfBirth")}`}
          />
          <FieldError message={fieldErrors.dateOfBirth} />
        </div>
      </div>

      {/* Section: Contact Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="e.g. john.doe@company.com"
            className={`${inputCls} ${errorBorder("email")}`}
          />
          <FieldError message={fieldErrors.email} />
        </div>
        <div>
          <label className={labelCls}>
            Phone Number <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="e.g. 0901234567"
            className={`${inputCls} ${errorBorder("phone")}`}
          />
          <FieldError message={fieldErrors.phone} />
        </div>
      </div>

      {/* Divider */}
      <div className="pt-2 border-b border-border-light">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">
          Identity & Legal Documents
        </p>
      </div>

      {/* Citizen ID + Tax Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>
            Citizen ID / National ID <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.citizenId}
            onChange={(e) => update("citizenId", e.target.value)}
            placeholder="e.g. 001234567890"
            className={`${inputCls} font-mono ${errorBorder("citizenId")}`}
          />
          <FieldError message={fieldErrors.citizenId} />
        </div>
        <div>
          <label className={labelCls}>
            Personal Tax ID <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.taxCode}
            onChange={(e) => update("taxCode", e.target.value)}
            placeholder="e.g. 0987654321"
            className={`${inputCls} font-mono ${errorBorder("taxCode")}`}
          />
          <FieldError message={fieldErrors.taxCode} />
        </div>
      </div>

      {/* Address */}
      <div>
        <label className={labelCls}>
          Permanent Address <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => update("address", e.target.value)}
          placeholder="e.g. 123 Nguyen Hue St, District 1, HCMC"
          className={`${inputCls} ${errorBorder("address")}`}
        />
        <FieldError message={fieldErrors.address} />
      </div>
    </div>
  );
};

export default PersonalInfoForm;
