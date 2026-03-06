import { useState, useEffect } from "react";
import ManagerPerformance from "./ManagerPerformance";
import HRPerformance from "./HRPerformance";
import EmployeePerformance from "./EmployeePerformance";
import MentorPerformance from "./MentorPerformance";
import { getToken } from "../services/authService";
import { decodeJwt } from "../utils/jwtDecode";

const PerformanceModule = () => {
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const token = getToken();
        if (token) {
            const payload = decodeJwt(token);
            setUserRole(payload?.role?.toUpperCase() || 'EMPLOYEE');
        }
    }, []);

    if (!userRole) return <div className="p-10 text-center uppercase font-black opacity-20 tracking-widest italic">Identifying Role...</div>;

    if (userRole === 'HR') {
        return <HRPerformance activeTab="hr" setActiveTab={() => { }} />;
    }

    if (userRole === 'MANAGER') {
        return <ManagerPerformance />;
    }

    if (userRole === 'MENTOR') {
        return <MentorPerformance />;
    }

    return <EmployeePerformance />;
};

export default PerformanceModule;
