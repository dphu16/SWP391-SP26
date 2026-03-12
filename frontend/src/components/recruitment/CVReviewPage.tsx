import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { applicationService } from "../../services/applicationService";
import type { Application } from "../../types";
import { LoadingSpinner, ErrorMessage } from "./StatusDisplay";
import { useToast } from "../ui/Toast";
import { getToken } from "../../services/authService";
import { decodeJwt } from "../../utils/jwtDecode";

const CVReviewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { error: toastError, success: toastSuccess } = useToast();

    const [app, setApp] = useState<Application | null>(null);
    const [reviewRef, setReviewRef] = useState<{ reviewerName: string; comment: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [comment, setComment] = useState("");
    const [isReviewing, setIsReviewing] = useState(false);

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
    const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
    const [interviewFeedback, setInterviewFeedback] = useState("");
    const [interviewScore, setInterviewScore] = useState<number | "">("");
    const [interviewStatus, setInterviewStatus] = useState("SCHEDULED");
    const [isUpdatingInterview, setIsUpdatingInterview] = useState(false);

    const fetchApp = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await applicationService.getById(id);
            setApp(res.data);
            if (res.data.status !== "APPLIED") {
                try {
                    const reviewRes = await applicationService.getCVReview(id);
                    setReviewRef(reviewRes.data);
                } catch (e) {
                    console.error("Could not fetch cv review info", e);
                }

                try {
                    const intRes = await applicationService.getInterview(id);
                    setInterviewData(intRes.data);
                    setInterviewFeedback(intRes.data.feedback || "");
                    setInterviewScore(intRes.data.score || "");
                    setInterviewStatus(intRes.data.status || "SCHEDULED");
                } catch (e) {
                    console.error("Could not fetch interview info", e);
                }
            }
        } catch (err) {
            setError("Failed to fetch application details.");
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
                navigate(-1);
            }
        } catch (err: any) {
            toastError("Error", err?.response?.data || "Failed to submit review");
        } finally {
            setIsReviewing(false);
        }
    };

    const handleSaveDates = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !startTime || !endTime) return;
        try {
            setIsSavingDates(true);
            await applicationService.setDateLimit({
                applicationId: id,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString()
            });
            toastSuccess("Success", "Date limits saved successfully");
            navigate(-1);
        } catch (err: any) {
            toastError("Error", err?.response?.data || "Failed to save date limits");
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
            toastError("Error", err?.response?.data || "Failed to schedule interview");
        } finally {
            setIsScheduling(false);
        }
    };

    const handleUpdateInterview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!interviewData?.id || !id) return;
        try {
            setIsUpdatingInterview(true);
            await applicationService.updateInterviewResult(interviewData.id, {
                appId: interviewData.appId,
                interviewerId: interviewData.interviewerId,
                scheduleTime: interviewData.scheduleTime,
                feedback: interviewFeedback,
                score: Number(interviewScore) || 0,
                status: interviewStatus
            });

            const updatedRes = await applicationService.getInterview(id);
            setInterviewData(updatedRes.data);
            setInterviewFeedback(updatedRes.data.feedback || "");
            setInterviewScore(updatedRes.data.score || "");
            setInterviewStatus(updatedRes.data.status || "SCHEDULED");

            toastSuccess("Success", "Interview details updated successfully");
            fetchApp(); // fetch full application again just in case status changed
        } catch (err: any) {
            toastError("Error", err?.response?.data || "Failed to update interview");
        } finally {
            setIsUpdatingInterview(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error || !app) return <ErrorMessage message={error || "Application not found"} />;

    return (
        <div className="space-y-6 animate-fade-in pb-10 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-text-secondary-light mb-2">
                        <button onClick={() => navigate(-1)} className="hover:text-primary transition-colors flex items-center gap-1">
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
                        <div>
                            <label className="text-[10px] font-bold text-text-muted-light uppercase">Contact Info</label>
                            <p className="text-text-secondary-light">{app.email}</p>
                            <p className="text-text-secondary-light">{app.phone}</p>
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

                {/* Review Form */}
                {app.status === "APPLIED" ? (
                    !showDateForm ? (
                        <section className="p-6 rounded-2xl border border-border-light bg-white shadow-card">
                            <h2 className="text-lg font-bold mb-4 text-text-primary-light flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                CV Review
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary-light mb-2">Comment</label>
                                    <textarea
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-none"
                                        rows={4}
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
                                            onChange={e => setStartTime(e.target.value)}
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
                        {interviewData && (
                            <section className="p-6 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-card animate-slide-up">
                                <h2 className="text-lg font-bold mb-4 text-blue-800 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    Interview Record
                                </h2>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 flex flex-col gap-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Interviewer</label>
                                            <p className="text-sm font-semibold text-gray-800">{interviewData.interviewerName}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Schedule Time</label>
                                            <p className="text-sm font-semibold text-gray-800">{new Date(interviewData.scheduleTime).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <form onSubmit={handleUpdateInterview} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-blue-900 mb-1">Status</label>
                                                <select
                                                    value={interviewStatus}
                                                    onChange={e => setInterviewStatus(e.target.value)}
                                                    className="w-full px-4 py-2 rounded-xl border border-blue-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                                >
                                                    <option value="SCHEDULED">SCHEDULED</option>
                                                    <option value="COMPLETED">COMPLETED</option>
                                                    <option value="CANCELLED">CANCELLED</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-blue-900 mb-1">Score</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={interviewScore}
                                                    onChange={e => setInterviewScore(e.target.value ? Number(e.target.value) : "")}
                                                    className="w-full px-4 py-2 rounded-xl border border-blue-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                                    placeholder="0.00 to 10.00"
                                                    min="0"
                                                    max="10"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-blue-900 mb-1">Feedback</label>
                                            <textarea
                                                className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                                                rows={4}
                                                placeholder="Add interview feedback here..."
                                                value={interviewFeedback}
                                                onChange={e => setInterviewFeedback(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            <button
                                                type="submit"
                                                disabled={isUpdatingInterview}
                                                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isUpdatingInterview && <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                                Update Interview Record
                                            </button>
                                        </div>
                                    </form>
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
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Reviewer</label>
                                            <p className="text-sm font-semibold text-gray-800">{reviewRef.reviewerName}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Comment</label>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{reviewRef.comment || <span className="text-gray-400 italic">No comment provided.</span>}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CVReviewPage;
