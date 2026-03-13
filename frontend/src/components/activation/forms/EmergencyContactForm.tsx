import React from "react";

interface EmergencyContactFormProps {
  contactName: string;
  setContactName: (val: string) => void;
  relationship: string;
  setRelationship: (val: string) => void;
  contactPhone: string;
  setContactPhone: (val: string) => void;
  contactAddress: string;
  setContactAddress: (val: string) => void;
  errors?: Record<string, string>;
}

const EmergencyContactForm: React.FC<EmergencyContactFormProps> = ({
  contactName,
  setContactName,
  relationship,
  setRelationship,
  contactPhone,
  setContactPhone,
  contactAddress,
  setContactAddress,
  errors,
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contact Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder="e.g. Jane Doe"
          className={`w-full px-3.5 py-2.5 rounded-xl border ${errors?.contactName ? 'border-rose-500' : 'border-gray-300'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
        />
        {errors?.contactName && <p className="text-rose-500 text-xs mt-1.5">{errors.contactName}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Relationship <span className="text-rose-500">*</span>
        </label>
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className={`w-full px-3.5 py-2.5 rounded-xl border ${errors?.relationship ? 'border-rose-500' : 'border-gray-300'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white`}
        >
          <option value="">Select relationship</option>
          <option value="DAD">Dad</option>
          <option value="MOM">Mom</option>
          <option value="WIFE">Wife</option>
        </select>
        {errors?.relationship && <p className="text-rose-500 text-xs mt-1.5">{errors.relationship}</p>}
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone <span className="text-rose-500">*</span>
        </label>
        <input
          type="tel"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="e.g. 0912345678"
          className={`w-full px-3.5 py-2.5 rounded-xl border ${errors?.contactPhone ? 'border-rose-500' : 'border-gray-300'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
        />
        {errors?.contactPhone && <p className="text-rose-500 text-xs mt-1.5">{errors.contactPhone}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <input
          type="text"
          value={contactAddress}
          onChange={(e) => setContactAddress(e.target.value)}
          placeholder="Optional"
          className={`w-full px-3.5 py-2.5 rounded-xl border ${errors?.contactAddress ? 'border-rose-500' : 'border-gray-300'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
        />
        {errors?.contactAddress && <p className="text-rose-500 text-xs mt-1.5">{errors.contactAddress}</p>}
      </div>
    </div>
  </div>
);

export default EmergencyContactForm;
