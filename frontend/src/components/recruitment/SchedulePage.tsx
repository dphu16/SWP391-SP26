import React, { useState, useEffect } from "react";
import { applicationService } from "../../services/applicationService";
import { LoadingSpinner, ErrorMessage } from "./StatusDisplay";
import { getToken } from "../../services/authService";
import { decodeJwt } from "../../utils/jwtDecode";
import { Link } from "react-router-dom";

interface InterviewData {
    id: string;
    appId: string;
    interviewerId: string;
    interviewerName: string;
    scheduleTime: string;
    status: string;
    feedback: string | null;
    score: number | null;
}

const SchedulePage: React.FC = () => {
    const [interviews, setInterviews] = useState<InterviewData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                setLoading(true);
                const token = getToken();
                const payload = token ? decodeJwt(token) : null;
                const employeeId = payload?.employeeId;

                if (!employeeId) {
                    setError("Could not match employee ID from your account.");
                    setLoading(false);
                    return;
                }

                const res = await applicationService.getInterviewByHr(employeeId);
                // sort chronologically
                const sortedInterviews = res.data.sort((a, b) => new Date(a.scheduleTime).getTime() - new Date(b.scheduleTime).getTime());
                setInterviews(sortedInterviews);
            } catch (err: any) {
                setError("Failed to load interview schedule.");
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6 animate-fade-in pb-10 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold font-heading text-text-primary-light tracking-tight">
                        My Interview Schedule
                    </h1>
                    <p className="text-text-secondary-light">
                        View upcoming and past interviews assigned to you.
                    </p>
                </div>
            </div>

            {error ? (
                <ErrorMessage message={error} />
            ) : (
                <div className="bg-white rounded-2xl shadow-card border border-border-light overflow-hidden">
                    {interviews.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 font-medium">
                            No interviews scheduled for you currently.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Date & Time</th>
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Status</th>
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Score / Feedback</th>
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {interviews.map(interview => {
                                        const d = new Date(interview.scheduleTime);
                                        const dateStr = d.toLocaleDateString();
                                        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        return (
                                            <tr key={interview.id} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-900">{dateStr}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        {timeStr}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${interview.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                                                            interview.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                                                'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {interview.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {interview.score !== null ? `${interview.score}/10` : '-'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]" title={interview.feedback || ""}>
                                                        {interview.feedback || <span className="italic">No feedback</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link
                                                        to={`/recruitment/cvs/${interview.appId}`}
                                                        className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm inline-block"
                                                    >
                                                        Review Application
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SchedulePage;
