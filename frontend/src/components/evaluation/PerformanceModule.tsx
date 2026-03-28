import { useState, useEffect } from "react";
import ManagerPerformance from "./ManagerPerformance";
import HRPerformance from "./HRPerformance";
import EmployeePerformance from "./EmployeePerformance";
import MentorPerformance from "./MentorPerformance";
import { getToken } from "../../services/authService";
import { decodeJwt } from "../../utils/jwtDecode";

const PerformanceModule = () => {
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [activeView, setActiveView] = useState<string | null>(null);

    useEffect(() => {
        const token = getToken();
        if (token) {
            const payload = decodeJwt(token);
            const roles = (payload?.roles || []).map((r: string) => r.replace(/^ROLE_/i, '').toUpperCase());
            setUserRoles(roles);
            
            // Pick highest-priority role as default view
            const priority = ['HR', 'MANAGER', 'MENTOR'];
            const primaryRole = priority.find(p => roles.includes(p)) || 'EMPLOYEE';
            setActiveView(primaryRole);
        }
    }, []);

    if (!activeView) return <div className="p-10 text-center uppercase font-black opacity-20 tracking-widest italic">Identifying Role...</div>;

    // Show switcher if user is both MENTOR and EMPLOYEE
    const showMentorToggle = userRoles.includes('MENTOR') && userRoles.includes('EMPLOYEE');

    const renderContent = () => {
        if (activeView === 'HR') {
            return <HRPerformance activeTab="hr" setActiveTab={() => { }} />;
        }
        if (activeView === 'MANAGER') {
            return <ManagerPerformance />;
        }
        if (activeView === 'MENTOR') {
            return <MentorPerformance />;
        }
        return <EmployeePerformance />;
    };

    return (
        <div className="flex flex-col h-full">
            {showMentorToggle && (
                <div className="flex justify-end mb-6">
                    <div className="flex bg-surface-2-light dark:bg-surface-2-dark p-1 rounded-xl shadow-inner border border-border-light dark:border-border-dark">
                        <button
                            onClick={() => setActiveView("EMPLOYEE")}
                            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${
                                activeView === "EMPLOYEE"
                                ? "bg-white dark:bg-surface-dark text-primary shadow-sm"
                                : "text-text-muted-light dark:text-text-muted-dark hover:text-text-primary-light"
                            }`}
                        >
                            My KPI
                        </button>
                        <button
                            onClick={() => setActiveView("MENTOR")}
                            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${
                                activeView === "MENTOR"
                                ? "bg-white dark:bg-surface-dark text-primary shadow-sm"
                                : "text-text-muted-light dark:text-text-muted-dark hover:text-text-primary-light"
                            }`}
                        >
                            Review Performance
                        </button>
                    </div>
                </div>
            )}
            {renderContent()}
        </div>
    );
};

export default PerformanceModule;
