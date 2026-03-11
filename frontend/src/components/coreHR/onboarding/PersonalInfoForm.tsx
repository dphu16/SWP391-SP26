import React from "react";
import { inputCls, labelCls, SelectWrapper } from "./formConstants";
import type { CreateNewHireDTO } from "../hooks/types";

interface PersonalInfoFormProps {
  formData: CreateNewHireDTO;
  setFormData: React.Dispatch<React.SetStateAction<CreateNewHireDTO>>;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  formData,
  setFormData,
}) => {
  const update = (field: keyof CreateNewHireDTO, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-5">
      {/* Full Name + Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => update("fullName", e.target.value)}
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
            onChange={(e) => update("email", e.target.value)}
            placeholder="e.g. john.doe@company.com"
            className={inputCls}
          />
        </div>
      </div>

      {/* Phone + Date of Birth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Phone Number</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="e.g. 0901234567"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Date of Birth</label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => update("dateOfBirth", e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {/* Gender */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      {/* Divider */}
      <div className="pt-1 pb-2 border-b border-border-light">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">
          Identity & Legal Documents
        </p>
      </div>

      {/* Citizen ID + Tax Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Citizen ID / National ID</label>
          <input
            type="text"
            value={formData.citizenId}
            onChange={(e) => update("citizenId", e.target.value)}
            placeholder="e.g. 001234567890"
            className={`${inputCls} font-mono`}
          />
        </div>
        <div>
          <label className={labelCls}>Personal Tax ID</label>
          <input
            type="text"
            value={formData.taxCode}
            onChange={(e) => update("taxCode", e.target.value)}
            placeholder="e.g. 0987654321"
            className={`${inputCls} font-mono`}
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <label className={labelCls}>Permanent Address</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => update("address", e.target.value)}
          placeholder="e.g. 123 Nguyen Hue St, District 1, HCMC"
          className={inputCls}
        />
      </div>
    </div>
  );
};

export default PersonalInfoForm;
