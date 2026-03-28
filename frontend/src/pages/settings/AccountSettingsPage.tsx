import React from "react";
import ChangePasswordForm from "../../components/settings/ChangePasswordForm";
import { getToken } from "../../services/authService";
import { decodeJwt } from "../../utils/jwtDecode";

const AccountSettingsPage: React.FC = () => {
    const payload = decodeJwt(getToken());
    
    const user = {
        name: payload?.fullName || payload?.sub || "User",
        email: payload?.sub || "N/A",
        role: payload?.roles?.[0]?.replace("ROLE_", "") || "—",
        avatarUrl: payload?.avatarUrl || ""
    };

    const avatarColors = [
        "bg-primary/10 text-primary",
        "bg-blue-100 text-blue-600",
        "bg-purple-100 text-purple-600",
      ];
    const avatarColor = avatarColors[(user.name.charCodeAt(0) ?? 0) % avatarColors.length];
    const avatarInitials = user.name.slice(0, 2).toUpperCase();

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold font-heading text-text-primary-light">Account Settings</h1>
                <p className="text-sm text-text-secondary-light">Manage your profile information and security settings.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Information Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-border-light shadow-sm p-6 space-y-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="relative">
                                {user.avatarUrl ? (
                                    <img 
                                        src={user.avatarUrl} 
                                        alt={user.name} 
                                        className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/10" 
                                    />
                                ) : (
                                    <div className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold ring-4 ring-primary/10 ${avatarColor}`}>
                                        {avatarInitials}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-text-primary-light">{user.name}</h2>
                                <p className="text-xs font-semibold text-primary uppercase tracking-wider">{user.role}</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-text-muted-light uppercase tracking-widest">Email Address</label>
                                <p className="text-sm font-medium text-text-primary-light break-all">{user.email}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-text-muted-light uppercase tracking-widest">Full Name</label>
                                <p className="text-sm font-medium text-text-primary-light">{user.name}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Change Password Section */}
                <div className="lg:col-span-2">
                    <ChangePasswordForm />
                </div>
            </div>
        </div>
    );
};

export default AccountSettingsPage;
