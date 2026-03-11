import React from "react";

interface PasswordFormProps {
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
}

const PasswordForm: React.FC<PasswordFormProps> = ({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
}) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        New Password <span className="text-rose-500">*</span>
      </label>
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="At least 8 characters"
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Confirm Password <span className="text-rose-500">*</span>
      </label>
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Re-enter your password"
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  </div>
);

export default PasswordForm;
