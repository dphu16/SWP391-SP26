import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { applicationService } from "../../services/applicationService";
import type { Application } from "../../types";
import { LoadingSpinner, ErrorMessage } from "./StatusDisplay";
import { useToast } from "../ui/Toast";
import { getToken } from "../../services/authService";
import { decodeJwt } from "../../utils/jwtDecode";

const CVReviewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const { error: toastError, success: toastSuccess } = useToast();

    const [app, setApp] = useState<Application | null>(null);
    const [reviewRef, setReviewRef] = useState<{ reviewerName: string; comment: string; result: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleBack = useCallback(() => {
        const jId = (location.state as any)?.jobId || searchParams.get("jobId") || app?.jobId;
        const dId = (location.state as any)?.deptId || searchParams.get("deptId");
        // Determine the best status to return to (application's current status is most accurate)
        const s = app?.status || (location.state as any)?.status || "APPLIED";

        // Navigation with no URL parameters at all
        navigate(`/recruitment/cvs`, { state: { jobId: jId, deptId: dId, status: s } });
    }, [app, navigate, searchParams, location.state]);

    const [comment, setComment] = useState("");
    const [isReviewing, setIsReviewing] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Date Limit form states
    const [showDateForm, setShowDateForm] = useState(false);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [isSavingDates, setIsSavingDates] = useState(false);

    // Interview Schedule states
    const [interviewTime, setInterviewTime] = useState("");
    const [isScheduling, setIsScheduling] = useState(false);

    // Interview Tracking states
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
    const [interviews, setInterviews] = useState<InterviewData[]>([]);
    const [expandedFeedbackIds, setExpandedFeedbackIds] = useState<string[]>([]);

    const toggleFeedback = (id: string) => {
        setExpandedFeedbackIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const fetchApp = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await applicationService.getById(id);
            const appData = res.data;
            setApp(appData);

            // Populate dates if they exist (formatted for type="date" input)
            if (appData.start) {
                setStartTime(new Date(appData.start).toISOString().split("T")[0]);
            }
            if (appData.end) {
                setEndTime(new Date(appData.end).toISOString().split("T")[0]);
            }

            // Always check for existing review to determine if we should show evaluation form or date form
            try {
                const reviewRes = await applicationService.getCVReview(id);
                if (reviewRes.data) {
                    setReviewRef(reviewRes.data);
                    // If already PASSED but still in APPLIED status, jump to date form
                    if (reviewRes.data.result === "PASSED" && appData.status === "APPLIED") {
                        setShowDateForm(true);
                    }
                }
            } catch (e) {
                console.log("No review record found yet");
            }

            if (appData.status !== "APPLIED") {
                try {
                    const intRes = await applicationService.getInterview(id);
                    setInterviews(intRes.data);
                } catch (e) {
                    console.error("Could not fetch interview info", e);
                }
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to fetch application details.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchApp();
    }, [fetchApp]);

    const handleReview = async (result: "PASSED" | "FAILED") => {
        if (!id) return;
        try {
            setIsReviewing(true);
            const token = getToken();
            const payload = token ? decodeJwt(token) : null;
            const reviewerId = payload?.employeeId;

            if (!reviewerId) {
                toastError("Auth Error", "Could not identify your user account.");
                setIsReviewing(false);
                return;
            }

            await applicationService.reviewCV({
                applicationId: id,
                reviewerId: reviewerId,
                result,
                comment
            });
            toastSuccess("Success", `CV marked as ${result}`);

            if (result === "PASSED") {
                setShowDateForm(true);
            } else {
                handleBack();
            }
        } catch (err: any) {
            setFormError(err?.response?.data?.message || err?.response?.data || "Failed to submit review");
        } finally {
            setIsReviewing(false);
        }
    };

    const handleSaveDates = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !startTime || !endTime) return;

        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (start >= end) {
            toastError("Validation Error", "Start time must be before end time.");
            return;
        }

        if (diffDays < 6) {
            toastError("Validation Error", "The interview timeline must be at least 6 days apart.");
            return;
        }

        try {
            setIsSavingDates(true);
            await applicationService.setDateLimit({
                applicationId: id,
                startTime: start.toISOString(),
                endTime: end.toISOString()
            });
            toastSuccess("Success", "Date limits saved successfully");
            handleBack();
        } catch (err: any) {
            setFormError(err?.response?.data?.message || err?.response?.data || "Failed to save date limits");
        } finally {
            setIsSavingDates(false);
        }
    };

    const handleScheduleInterview = async () => {
        if (!id || !interviewTime) return;
        try {
            setIsScheduling(true);
            const token = getToken();
            const payload = token ? decodeJwt(token) : null;
            const interviewerId = payload?.employeeId;

            if (!interviewerId) {
                toastError("Auth Error", "Could not identify your user account.");
                setIsScheduling(false);
                return;
            }

            await applicationService.scheduleInterview({
                appId: id,
                interviewerId: interviewerId,
                scheduleTime: new Date(interviewTime).toISOString()
            });
            toastSuccess("Success", "Interview scheduled successfully!");
            setInterviewTime("");
            fetchApp(); // Reload to fetch the newly created interview
        } catch (err: any) {
            setFormError(err?.response?.data?.message || "Failed to schedule interview");
        } finally {
            setIsScheduling(false);
        }
    };



    if (loading) return <LoadingSpinner />;
    if (error || !app) return <ErrorMessage message={error || "Application not found"} />;

    return (
        <div className="space-y-6 animate-fade-in pb-10 max-w-[1600px] mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-text-secondary-light mb-2">
                        <button onClick={handleBack} className="hover:text-primary transition-colors flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            Back
                        </button>
                    </div>
                    <h1 className="text-3xl font-bold font-heading text-text-primary-light tracking-tight">
                        Review CV
                    </h1>
                </div>
            </div>

            <div className="space-y-6">
                {/* Candidate Info */}
                <section className="p-6 rounded-2xl border border-border-light bg-white shadow-card">
                    <h2 className="text-lg font-bold mb-4 text-text-primary-light flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Candidate Info
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[10px] font-bold text-text-muted-light uppercase">Full Name</label>
                            <p className="font-semibold text-text-primary-light text-lg">{app.fullName}</p>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-text-muted-light uppercase tracking-wider">Contact Info</label>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 group">
                                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    </div>
                                    <p className="text-sm font-medium text-text-secondary-light">{app.email}</p>
                                </div>
                                <div className="flex items-center gap-2 group">
                                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    </div>
                                    <p className="text-sm font-medium text-text-secondary-light">{app.phone || "N/A"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-4">
                        {app.cvUrl ? (
                            <a
                                href={`http://localhost:8080${app.cvUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-700 font-semibold rounded-xl hover:bg-blue-100 transition-colors shadow-sm"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View CV Document
                            </a>
                        ) : (
                            <span className="text-gray-400 italic">No CV available</span>
                        )}
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                            Status: {app.status}
                        </span>

                        {app.status === "INTERVIEW" && (
                            <div className="ml-auto flex items-center gap-3">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Schedule
                                </label>
                                <input
                                    type="datetime-local"
                                    value={interviewTime}
                                    onChange={(e) => setInterviewTime(e.target.value)}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                                    title="Interview Time"
                                />
                                <button
                                    onClick={handleScheduleInterview}
                                    disabled={!interviewTime || isScheduling}
                                    className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap"
                                >
                                    {isScheduling ? "Saving..." : "Set Interview"}
                                </button>
                            </div>
                        )}
                    </div>
                </section>
                {formError && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700 animate-fade-in shadow-sm">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-sm font-semibold">{formError}</span>
                    </div>
                )}

                {/* Review Form: Only show if status is APPLIED and (no review yet OR review is PASSED and we're in date-limit phase) */}
                {app.status === "APPLIED" && (!reviewRef || reviewRef.result === "PASSED") ? (
                    !showDateForm ? (
                        <section className="p-8 rounded-2xl border border-border-light bg-white shadow-card">
                            <div className="grid grid-cols-1 lg:grid-cols-10 gap-10">
                                {/* Left Side: CV Viewer (60%) */}
                                <div className="lg:col-span-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-bold text-text-primary-light flex items-center gap-2">
                                            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            Candidate CV
                                        </h2>

                                    </div>
                                    <div className="w-full bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative group aspect-[1/1.414]">
                                        <iframe
                                            src={`http://localhost:8080${app.cvUrl}#toolbar=0&navpanes=0&view=FitH`}
                                            className="absolute top-0 left-0 w-full h-full border-none"
                                            title="Candidate CV Viewer"
                                        />
                                    </div>
                                </div>

                                {/* Right Side: Review Form (40%) */}
                                <div className="lg:col-span-4 space-y-6">
                                    <h2 className="text-lg font-bold text-text-primary-light flex items-center gap-2">
                                        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        CV Review Assessment
                                    </h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary-light mb-2">Comment</label>
                                            <textarea
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-none"
                                                rows={15}
                                                placeholder="Add your review comments here..."
                                                value={comment}
                                                onChange={e => setComment(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="flex gap-4 pt-4">
                                            <button
                                                onClick={() => handleReview("FAILED")}
                                                disabled={isReviewing}
                                                className="flex-1 px-6 py-3 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100 transition-colors shadow-sm disabled:opacity-50"
                                            >
                                                FAIL Candidate
                                            </button>
                                            <button
                                                onClick={() => handleReview("PASSED")}
                                                disabled={isReviewing}
                                                className="flex-1 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isReviewing && <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                                PASS Candidate
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    ) : (
                        /* Date Limit Form After Pass */
                        <section className="p-6 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-card animate-slide-up">
                            <h2 className="text-lg font-bold mb-4 text-emerald-800 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Set Interview Time Constraints
                            </h2>
                            <form onSubmit={handleSaveDates} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-emerald-900 mb-1">Start Time</label>
                                        <input
                                            type="date"
                                            required
                                            value={startTime}
                                            onChange={e => {
                                                const newStart = e.target.value;
                                                setStartTime(newStart);
                                                if (newStart) {
                                                    const d = new Date(newStart);
                                                    d.setDate(d.getDate() + 6);
                                                    setEndTime(d.toISOString().split("T")[0]);
                                                }
                                            }}
                                            className="w-full px-4 py-2.5 rounded-xl border border-emerald-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-emerald-900 mb-1">End Time</label>
                                        <input
                                            type="date"
                                            required
                                            value={endTime}
                                            onChange={e => setEndTime(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-emerald-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSavingDates}
                                        className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSavingDates && <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                        Save Timelines & Finish
                                    </button>
                                </div>
                            </form>
                        </section>
                    )
                ) : (
                    <div className="space-y-6">
                        {/* Interview Details Block */}
                        {/* Interview Details Block */}
                        {interviews.length > 0 && (
                            <section className="p-6 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-card animate-slide-up">
                                <h2 className="text-lg font-bold mb-4 text-blue-800 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    Interview Records
                                </h2>
                                <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Interviewer</th>
                                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Scheduled Time</th>
                                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Status</th>
                                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Score</th>
                                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">Feedback</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {interviews.map(int => {
                                                    const isExpanded = expandedFeedbackIds.includes(int.id);
                                                    return (
                                                        <React.Fragment key={int.id}>
                                                            <tr className="hover:bg-gray-50/80 transition-colors">
                                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{int.interviewerName}</td>
                                                                <td className="px-6 py-4"><span className="text-sm text-gray-800 font-medium">{new Date(int.scheduleTime).toLocaleString()}</span></td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${int.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' : int.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                                                                        {int.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm font-bold text-gray-900">{int.score !== null ? `${int.score}/10` : '-'}</td>
                                                                <td className="px-6 py-4">
                                                                    {int.feedback ? (
                                                                        <button
                                                                            onClick={() => toggleFeedback(int.id)}
                                                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isExpanded ? 'bg-indigo-600 text-white shadow-sm' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                                                                        >
                                                                            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                            </svg>
                                                                            {isExpanded ? 'Hide Feedback' : 'View Feedback'}
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-xs text-gray-400 italic">No feedback</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                            {isExpanded && int.feedback && (
                                                                <tr className="bg-indigo-50/30 animate-slide-down">
                                                                    <td colSpan={5} className="px-6 py-4">
                                                                        <div className="flex gap-3">
                                                                            <div className="pt-1 text-indigo-400">
                                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16L19.017 16C20.1216 16 21.017 16.8954 21.017 18L21.017 21L14.017 21ZM14.017 21C12.9124 21 12.017 20.1046 12.017 19L12.017 18C12.017 15.7909 13.8079 14 16.017 14L19.017 14C21.2261 14 23.017 15.7909 23.017 18L23.017 19C23.017 20.1046 22.1216 21 21.017 21L14.017 21ZM3 21L3 18C3 16.8954 3.89543 16 5 16L8 16C9.10457 16 10 16.8954 10 18L10 21L3 21ZM3 21C1.89543 21 1 20.1046 1 19L1 18C1 15.7909 2.79086 14 5 14L8 14C10.2091 14 12 15.7909 12 18L12 19C12 20.1046 11.1046 21 10 21L3 21ZM16.017 14C13.8079 14 12.017 15.7909 12.017 18L12.017 19C12.017 20.1046 12.9124 21 14.017 21L21.017 21C22.1216 21 23.017 20.1046 23.017 19L23.017 18C23.017 15.7909 21.2261 14 19.017 14L16.017 14Z" /></svg>
                                                                            </div>
                                                                            <p className="text-sm text-gray-700 italic whitespace-pre-wrap leading-relaxed">
                                                                                {int.feedback}
                                                                            </p>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Review Completed Block */}
                        <section className="p-6 rounded-2xl border border-indigo-200 bg-indigo-50/30 shadow-card animate-slide-up">
                            <h2 className="text-lg font-bold mb-4 text-indigo-800 flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Review Completed
                            </h2>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 flex flex-col gap-4">
                                <div className="flex gap-4 items-center border-b border-gray-100 pb-4">
                                    <div className="p-3 bg-indigo-100/50 rounded-full text-indigo-600">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-indigo-900 leading-relaxed font-medium">This candidate's CV review has been completed.</p>
                                        <p className="text-xs text-indigo-700 mt-0.5">Current recruiting phase: <strong className="font-bold uppercase tracking-wider">{app.status}</strong></p>
                                    </div>
                                </div>

                                {reviewRef && (
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-6">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Reviewer</label>
                                                <p className="text-sm font-semibold text-gray-800">{reviewRef.reviewerName}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Result</label>
                                                <div className="mt-0.5">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${reviewRef.result === 'PASSED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                        {reviewRef.result}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Comment</label>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{reviewRef.comment || <span className="text-gray-400 italic">No comment provided.</span>}</p>
                                        </div>
                                        {(app.start || app.end) && (
                                            <div className="pt-3 border-t border-gray-100">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Interview Timeline</label>
                                                <div className="flex gap-4 mt-1">
                                                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                                                        <span>Start: {app.start ? new Date(app.start).toLocaleDateString() : 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                                                        <span>End: {app.end ? new Date(app.end).toLocaleDateString() : 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )}
            </div >
        </div >
    );
};

export default CVReviewPage;
