import React, { useState, useEffect } from "react";
import { applicationService } from "../../services/applicationService";
import { LoadingSpinner, ErrorMessage } from "./StatusDisplay";
import { getToken } from "../../services/authService";
import { decodeJwt } from "../../utils/jwtDecode";
import type { Application } from "../../types";

interface InterviewData {
    id: string;
    appId: string;
    interviewerId: string;
    interviewerName: string;
    scheduleTime: string;
    status: string;
    feedback: string | null;
    score: number | null;
    fullName?: string;
    jobTitle?: string;
}

const SchedulePage: React.FC = () => {
    const [interviews, setInterviews] = useState<InterviewData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Review application states
    const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
    const [appDetail, setAppDetail] = useState<Application | null>(null);
    const [loadingApp, setLoadingApp] = useState(false);
    const [resultText, setResultText] = useState("");
    const [feedbackText, setFeedbackText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            setError(err?.response?.data?.message || "Failed to load interview schedule.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, []);

    const handleToggleReview = async (interview: InterviewData) => {
        if (selectedInterviewId === interview.id) {
            setSelectedInterviewId(null);
            setAppDetail(null);
            return;
        }

        setSelectedInterviewId(interview.id);
        setResultText(interview.score?.toString() || "");
        setFeedbackText(interview.feedback || "");
        setLoadingApp(true);
        try {
            const res = await applicationService.getById(interview.appId);
            setAppDetail(res.data);
        } catch (err) {
            console.error("Failed to load application details", err);
        } finally {
            setLoadingApp(false);
        }
    };

    const handleSubmitResult = async (interview: InterviewData, status: "COMPLETED" | "CANCELLED") => {
        setIsSubmitting(true);
        try {
            await applicationService.updateInterviewResult(interview.id, {
                appId: interview.appId,
                interviewerId: interview.interviewerId,
                scheduleTime: interview.scheduleTime,
                status: status,
                feedback: feedbackText,
                score: parseFloat(resultText)
            });
            // Reload list
            await fetchSchedule();
            setSelectedInterviewId(null);
            setAppDetail(null);
            setResultText("");
            setFeedbackText("");
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to update interview result.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6 animate-fade-in pb-10 max-w-[1600px] mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold font-heading text-text-primary-light tracking-tight">
                        My Interview Schedule {interviews.length > 0 && `(${interviews.length})`}
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
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Job Title</th>
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Candidate Name</th>
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Time</th>
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Date</th>
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {interviews.map(interview => {
                                        const d = new Date(interview.scheduleTime);
                                        const dateStr = d.toLocaleDateString();
                                        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        const isActive = selectedInterviewId === interview.id;
                                        return (
                                            <React.Fragment key={interview.id}>
                                                <tr className={`hover:bg-gray-50/80 transition-colors ${isActive ? "bg-indigo-50/30" : ""}`}>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-medium text-gray-900">{interview.jobTitle || "-"}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-gray-900">{interview.fullName || interview.appId.substring(0, 8)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                                        {timeStr}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                                        {dateStr}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleToggleReview(interview)}
                                                            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-sm ${isActive ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
                                                        >
                                                            {isActive ? "Close Panel" : "Review Application"}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {isActive && (
                                                    <tr className="bg-white border-b border-gray-100">
                                                        <td colSpan={5} className="px-6 py-8">
                                                            {loadingApp ? (
                                                                <div className="flex justify-center py-10">
                                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                                                </div>
                                                            ) : appDetail ? (
                                                                <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 animate-fade-in">
                                                                    {/* Left Area: Information & Form (40%) */}
                                                                    <div className="lg:col-span-4 space-y-8">
                                                                        {/* Candidate Info Card */}
                                                                        <div>
                                                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                                                Candidate Info
                                                                            </h3>
                                                                            <div className="bg-gray-50 p-6 rounded-2xl space-y-3 border border-gray-100 shadow-sm">
                                                                                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                                                                    <span className="text-xs font-medium text-gray-500 uppercase">FullName</span>
                                                                                    <span className="text-sm font-bold text-gray-900">{appDetail.fullName}</span>
                                                                                </div>
                                                                                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                                                                    <span className="text-xs font-medium text-gray-500 uppercase">Email</span>
                                                                                    <span className="text-sm font-semibold text-gray-900">{appDetail.email}</span>
                                                                                </div>
                                                                                <div className="flex justify-between items-center pt-1">
                                                                                    <span className="text-xs font-medium text-gray-500 uppercase">Phone</span>
                                                                                    <span className="text-sm font-semibold text-gray-900">{appDetail.phone || "-"}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Assessment Form Card */}
                                                                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                                                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                                                                Interview Assessment
                                                                            </h3>

                                                                            <div className="space-y-4">
                                                                                <div>
                                                                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 ml-1">Score (0-10)</label>
                                                                                    <input
                                                                                        type="number"
                                                                                        required
                                                                                        step="0.1"
                                                                                        min="0"
                                                                                        max="10"
                                                                                        value={resultText}
                                                                                        onChange={(e) => setResultText(e.target.value)}
                                                                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all font-semibold"
                                                                                        placeholder="e.g. 8.5"
                                                                                        disabled={isSubmitting || interview.status !== 'SCHEDULED'}
                                                                                    />
                                                                                </div>

                                                                                <div>
                                                                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 ml-1">Detailed Feedback</label>
                                                                                    <textarea
                                                                                        rows={12}
                                                                                        value={feedbackText}
                                                                                        onChange={(e) => setFeedbackText(e.target.value)}
                                                                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all resize-none italic"
                                                                                        placeholder="Share your thoughts on the candidate"
                                                                                        disabled={isSubmitting || interview.status !== 'SCHEDULED'}
                                                                                    />
                                                                                </div>

                                                                                {interview.status === 'SCHEDULED' ? (
                                                                                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                                                                        <button
                                                                                            onClick={() => handleSubmitResult(interview, "COMPLETED")}
                                                                                            disabled={isSubmitting}
                                                                                            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold rounded-xl transition-all shadow-md active:scale-[0.98]"
                                                                                        >
                                                                                            {isSubmitting ? "Saving..." : "SUBMIT PASS"}
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => handleSubmitResult(interview, "CANCELLED")}
                                                                                            disabled={isSubmitting}
                                                                                            className="flex-1 py-3 px-4 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-bold rounded-xl transition-all shadow-md active:scale-[0.98]"
                                                                                        >
                                                                                            {isSubmitting ? "Saving..." : "MARK CANCEL"}
                                                                                        </button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
                                                                                        <span className="text-xs text-indigo-700 font-bold uppercase tracking-tight">Interview Completed</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Right Area: PDF Viewer (60%) */}
                                                                    <div className="lg:col-span-6 space-y-4">
                                                                        <div className="flex items-center justify-between mb-0">
                                                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                                                Candidate CV
                                                                            </h3>
                                                                            <a
                                                                                href={`http://localhost:8080${appDetail.cvUrl}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group transition-colors"
                                                                            >
                                                                                Open Full Screen
                                                                                <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                                            </a>
                                                                        </div>

                                                                        <div className="w-full bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative group aspect-[1/1.414]">
                                                                            <iframe
                                                                                src={`http://localhost:8080${appDetail.cvUrl}#toolbar=0&navpanes=0&view=FitH`}
                                                                                className="absolute top-0 left-0 w-full h-full border-none"
                                                                                title="Candidate CV Viewer"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-center text-rose-500 font-semibold">Could not load application detail.</div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
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
