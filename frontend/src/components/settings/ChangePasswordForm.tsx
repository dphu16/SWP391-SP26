import React, { useState } from "react";
import { InputField } from "../auth/shared";
import { EyeIcon, EyeOffIcon, SpinnerIcon } from "../auth/icons";
import { useToast } from "../ui/Toast";
import apiClient from "../../services/apiClient";

const ChangePasswordForm: React.FC = () => {
    const { success, error: toastError } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name as keyof typeof errors]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const validate = () => {
        let valid = true;
        const newErrors = { currentPassword: "", newPassword: "", confirmPassword: "" };

        if (!form.currentPassword) {
            newErrors.currentPassword = "Current password is required";
            valid = false;
        }
        if (!form.newPassword) {
            newErrors.newPassword = "New password is required";
            valid = false;
        } else if (form.newPassword.length < 8) {
            newErrors.newPassword = "New password must be at least 8 characters";
            valid = false;
        }
        if (form.newPassword !== form.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        try {
            await apiClient.post("/api/account/change-password", {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });
            success("Success", "Password changed successfully");
            setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err: any) {
            const message = err.response?.data?.message || "Failed to change password";
            toastError("Error", message);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleIcon = (show: boolean, setter: React.Dispatch<React.SetStateAction<boolean>>) => (
        <button
            type="button"
            onClick={() => setter(!show)}
            className="p-1 hover:text-primary transition-colors cursor-pointer"
        >
            {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
    );

    return (
        <div className="bg-white rounded-2xl border border-border-light shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border-light bg-gray-50/50">
                <h3 className="text-base font-bold text-text-primary-light">Change Password</h3>
                <p className="text-xs text-text-secondary-light">Update your password to keep your account secure.</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <InputField
                    id="currentPassword"
                    label="Current Password"
                    type={showCurrent ? "text" : "password"}
                    value={form.currentPassword}
                    onChange={handleChange}
                    placeholder="Enter current password"
                    error={errors.currentPassword}
                    disabled={isLoading}
                    required
                    rightSlot={toggleIcon(showCurrent, setShowCurrent)}
                />

                <InputField
                    id="newPassword"
                    label="New Password"
                    type={showNew ? "text" : "password"}
                    value={form.newPassword}
                    onChange={handleChange}
                    placeholder="Enter new password"
                    error={errors.newPassword}
                    disabled={isLoading}
                    required
                    rightSlot={toggleIcon(showNew, setShowNew)}
                />

                <InputField
                    id="confirmPassword"
                    label="Confirm New Password"
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    error={errors.confirmPassword}
                    disabled={isLoading}
                    required
                    rightSlot={toggleIcon(showConfirm, setShowConfirm)}
                />

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {isLoading && <SpinnerIcon />}
                        {isLoading ? "Updating..." : "Update Password"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChangePasswordForm;
