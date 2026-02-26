import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jobRequestService } from "../services/jobRequestService";
import type { JobRequest } from "../types";
import { LoadingSpinner, ErrorMessage } from "../components/StatusDisplay";

const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark mb-1";
const valueCls = "text-sm font-semibold text-text-primary-light dark:text-text-primary-dark";

const JobRequestDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [request, setRequest] = useState<JobRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const res = await jobRequestService.getById(id);
                setRequest(res.data);
            } catch (err) {
                setError("Failed to load job request details.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    if (loading) return <LoadingSpinner />;
    if (error || !request) return <ErrorMessage message={error || "Job request not found."} />;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border-light dark:border-border-dark">
                <div className="space-y-2">
                    <button
                        onClick={() => navigate("/recruitment/job-requests")}
                        className="group flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:text-primary-hover transition-colors mb-4"
                    >
                        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-x-1">
                            <path fillRule="evenodd" d="M12.5 8a.5.5 0 01-.5.5H4.707l3.147 3.146a.5.5 0 01-.708.708l-4-4a.5.5 0 010-.708l4-4a.5.5 0 11.708.708L4.707 7.5H12a.5.5 0 01.5.5z" clipRule="evenodd" />
                        </svg>
                        Back to List
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black font-heading text-text-primary-light dark:text-text-primary-dark tracking-tight">
                            {request.title}
                        </h1>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${request.status === "PENDING" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                                request.status === "APPROVED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                                    request.status === "REJECTED" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" :
                                        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                            }`}>
                            {request.status}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/recruitment/job-requests/${request.id}/edit`)}
                        className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 cursor-pointer"
                    >
                        Edit Request
                    </button>
                </div>
            </div>

            {/* Grid Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Information */}
                <div className="md:col-span-2 space-y-8">
                    <section className="bg-surface-light dark:bg-surface-dark rounded-3xl p-8 border border-border-light dark:border-border-dark shadow-sm">
                        <h2 className="text-sm font-black uppercase tracking-widest text-text-primary-light dark:text-text-primary-dark mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Request Details
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-4">
                            <div>
                                <label className={labelCls}>Department</label>
                                <div className={valueCls}>{request.deptName}</div>
                                <div className="text-[10px] text-text-muted-light mt-0.5 font-mono">{request.deptId}</div>
                            </div>
                            <div>
                                <label className={labelCls}>Employment Type</label>
                                <div className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide">
                                    {request.type}
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Headcount</label>
                                <div className="text-lg font-black text-primary">{request.quantity} Position(s)</div>
                            </div>
                            <div>
                                <label className={labelCls}>Location</label>
                                <div className={valueCls}>{request.location}</div>
                            </div>
                            <div>
                                <label className={labelCls}>Reports To</label>
                                <div className={valueCls}>{request.reportTo || "None specified"}</div>
                            </div>
                            <div>
                                <label className={labelCls}>Reviewer</label>
                                <div className={valueCls}>{request.reviewer || "Not reviewed yet"}</div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-surface-light dark:bg-surface-dark rounded-3xl p-8 border border-border-light dark:border-border-dark shadow-sm">
                        <h2 className="text-sm font-black uppercase tracking-widest text-text-primary-light dark:text-text-primary-dark mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Reason for Hiring
                        </h2>
                        <div className="text-sm leading-relaxed text-text-secondary-light dark:text-text-secondary-dark bg-gray-50/50 dark:bg-gray-800/30 p-5 rounded-2xl italic border-l-4 border-gray-200 dark:border-gray-700">
                            {request.reason}
                        </div>
                    </section>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <section className="bg-surface-light dark:bg-surface-dark rounded-3xl p-6 border border-border-light dark:border-border-dark shadow-sm">
                        <label className={labelCls}>Internal ID</label>
                        <div className="font-mono text-xs text-text-muted-light dark:text-text-muted-dark break-all">
                            {request.id}
                        </div>
                    </section>

                    <section className="bg-surface-light dark:bg-surface-dark rounded-3xl p-6 border border-border-light dark:border-border-dark shadow-sm flex flex-col gap-4">
                        <h2 className="text-[11px] font-black uppercase tracking-widest text-text-primary-light dark:text-text-primary-dark">
                            Admin Feedback
                        </h2>
                        <div className="space-y-2">
                            <label className={labelCls}>HR Comment</label>
                            <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                                {request.comment || "No comments added yet."}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default JobRequestDetailPage;
