import React from "react";

interface BankAccountFormProps {
  accountNumber: string;
  setAccountNumber: (val: string) => void;
  bankName: string;
  setBankName: (val: string) => void;
  branchName: string;
  setBranchName: (val: string) => void;
  accountHolderName: string;
  setAccountHolderName: (val: string) => void;
  errors?: Record<string, string>;
}

const BankAccountForm: React.FC<BankAccountFormProps> = ({
  accountNumber,
  setAccountNumber,
  bankName,
  setBankName,
  branchName,
  setBranchName,
  accountHolderName,
  setAccountHolderName,
  errors,
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Account Number <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="e.g. 0123456789"
          className={`w-full px-3.5 py-2.5 rounded-xl border ${errors?.accountNumber ? 'border-rose-500' : 'border-gray-300'} text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
        />
        {errors?.accountNumber && <p className="text-rose-500 text-xs mt-1.5">{errors.accountNumber}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bank Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          placeholder="e.g. Vietcombank"
          className={`w-full px-3.5 py-2.5 rounded-xl border ${errors?.bankName ? 'border-rose-500' : 'border-gray-300'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
        />
        {errors?.bankName && <p className="text-rose-500 text-xs mt-1.5">{errors.bankName}</p>}
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Branch Name
        </label>
        <input
          type="text"
          value={branchName}
          onChange={(e) => setBranchName(e.target.value)}
          placeholder="Optional"
          className={`w-full px-3.5 py-2.5 rounded-xl border ${errors?.branchName ? 'border-rose-500' : 'border-gray-300'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
        />
        {errors?.branchName && <p className="text-rose-500 text-xs mt-1.5">{errors.branchName}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Account Holder Name
        </label>
        <input
          type="text"
          value={accountHolderName}
          onChange={(e) => setAccountHolderName(e.target.value)}
          placeholder="Optional"
          className={`w-full px-3.5 py-2.5 rounded-xl border ${errors?.accountHolderName ? 'border-rose-500' : 'border-gray-300'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
        />
        {errors?.accountHolderName && <p className="text-rose-500 text-xs mt-1.5">{errors.accountHolderName}</p>}
      </div>
    </div>
  </div>
);

export default BankAccountForm;
