import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jobService } from "../services/jobService";
import type { Job } from "../types";
import { LoadingSpinner, ErrorMessage } from "../components/StatusDisplay";
import { useToast } from "../../../shared/components/ui/Toast";

const JobDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { error: toastError } = useToast();

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchJob = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            setError(null);
            const res = await jobService.getById(id);
            setJob(res.data);
        } catch (err: any) {
            setError("Failed to load job details.");
            toastError("Error", "Could not fetch job info.");
        } finally {
            setLoading(false);
        }
    }, [id, toastError]);

    useEffect(() => {
        fetchJob();
    }, [fetchJob]);

    if (loading) return <LoadingSpinner />;
    if (error || !job) return <ErrorMessage message={error || "Job not found"} />;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header section with back button and basic info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <button
                        onClick={() => navigate("/recruitment/jobs")}
                        className="group flex items-center gap-2 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors mb-2"
                    >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-x-1">
                            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
                        </svg>
                        Back to Job Postings
                    </button>
                    <h1 className="text-3xl font-bold font-heading text-text-primary-light dark:text-text-primary-dark tracking-tight">
                        {job.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${job.status === "OPEN" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" :
                                job.status === "CLOSED" ? "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400" :
                                    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                            }`}>
                            {job.status}
                        </span>
                        <span className="text-sm text-text-muted-light dark:text-text-muted-dark flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Posted on: {new Date(job.createAt).toLocaleDateString()}
                        </span>
                        {job.closedTime && (
                            <span className="text-sm text-text-muted-light dark:text-text-muted-dark flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Closes on: {new Date(job.closedTime).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description Section */}
                    <section className="p-6 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-card">
                        <h2 className="text-lg font-bold mb-4 text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                            Job Description
                        </h2>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-text-secondary-light dark:text-text-secondary-dark whitespace-pre-wrap leading-relaxed">
                            {job.description}
                        </div>
                    </section>

                    {/* Responsibilities Section */}
                    <section className="p-6 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-card">
                        <h2 className="text-lg font-bold mb-4 text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            Key Responsibilities
                        </h2>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-text-secondary-light dark:text-text-secondary-dark whitespace-pre-wrap leading-relaxed">
                            {job.responsibility}
                        </div>
                    </section>

                    {/* Requirements Section */}
                    <section className="p-6 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-card">
                        <h2 className="text-lg font-bold mb-4 text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Requirements
                        </h2>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-text-secondary-light dark:text-text-secondary-dark whitespace-pre-wrap leading-relaxed">
                            {job.requirement}
                        </div>
                    </section>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <section className="p-6 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-card">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark mb-4">
                            Recruitment Info
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase">Number of Openings</label>
                                <p className="text-xl font-bold text-primary">{job.quantity}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase">HR Manager</label>
                                <p className="text-sm font-mono text-text-primary-light dark:text-text-primary-dark">{job.hrId || "N/A"}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark uppercase">Job Request ID</label>
                                <p className="text-sm font-mono text-text-primary-light dark:text-text-primary-dark">{job.reqId}</p>
                            </div>
                        </div>
                    </section>

                    <section className="p-6 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-card">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark mb-4 group flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Benefits
                        </h2>
                        <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark whitespace-pre-wrap leading-relaxed">
                            {job.benefit}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default JobDetailPage;
