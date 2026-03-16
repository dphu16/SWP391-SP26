import { useState, useEffect, useCallback } from "react";
import { applicationService } from "../services/applicationService";
import { useAuth } from "./useAuth";

export function useScheduleCount() {
    const [count, setCount] = useState(0);
    const { user } = useAuth();

    const fetchCount = useCallback(async () => {
        if (!user?.employeeId) {
            setCount(0);
            return;
        }
        try {
            const res = await applicationService.getInterviewByHr(user.employeeId);
            // Count only SCHEDULED status
            const scheduled = res.data.filter(i => i.status === "SCHEDULED").length;
            setCount(scheduled);
        } catch (err) {
            console.error("Failed to fetch schedule count", err);
        }
    }, [user?.employeeId]);

    useEffect(() => {
        fetchCount();
        // Refresh every 2 minutes for better UX
        const timer = setInterval(fetchCount, 2 * 60 * 1000);
        return () => clearInterval(timer);
    }, [fetchCount]);

    return { count, refresh: fetchCount };
}
