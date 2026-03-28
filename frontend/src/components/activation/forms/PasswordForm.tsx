import React from "react";

interface PasswordFormProps {
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  errors?: Record<string, string>;
  showNewPassword?: boolean;
  setShowNewPassword?: (val: boolean | ((prev: boolean) => boolean)) => void;
  showConfirmPassword?: boolean;
  setShowConfirmPassword?: (val: boolean | ((prev: boolean) => boolean)) => void;
}

const PasswordForm: React.FC<PasswordFormProps> = ({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  errors,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
}) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        New Password <span className="text-rose-500">*</span>
      </label>
      <div className="relative">
        <input
          type={showNewPassword ? "text" : "password"}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 6 characters"
          className={`w-full px-3.5 py-2.5 rounded-xl border ${errors?.newPassword ? 'border-rose-500' : 'border-gray-300'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
        />
        {setShowNewPassword && (
          <button
            type="button"
            onClick={() => setShowNewPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showNewPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.299 8.133 7.218 5 12 5c4.781 0 8.701 3.133 9.964 7.322a1.012 1.012 0 010 .644C20.701 15.867 16.781 19 12 19c-4.781 0-8.701-3.133-9.964-7.322z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {errors?.newPassword && <p className="text-rose-500 text-xs mt-1.5 font-medium">{errors.newPassword}</p>}
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Confirm Password <span className="text-rose-500">*</span>
      </label>
      <div className="relative">
        <input
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          className={`w-full px-3.5 py-2.5 rounded-xl border ${errors?.confirmPassword ? 'border-rose-500' : 'border-gray-300'} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
        />
        {setShowConfirmPassword && (
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showConfirmPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.299 8.133 7.218 5 12 5c4.781 0 8.701 3.133 9.964 7.322a1.012 1.012 0 010 .644C20.701 15.867 16.781 19 12 19c-4.781 0-8.701-3.133-9.964-7.322z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {errors?.confirmPassword && <p className="text-rose-500 text-xs mt-1.5 font-medium">{errors.confirmPassword}</p>}
    </div>
  </div>
);

export default PasswordForm;
