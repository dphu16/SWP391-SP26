import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { jobService } from "../../services/jobService";
import type { Job, JobStatus } from "../ui/types";
import { useToast } from "../ui/Toast";

const ITEMS_PER_PAGE = 5;

const JobListPage: React.FC = () => {
    const navigate = useNavigate();
    const { error: toastError, success: toastSuccess } = useToast();

    const [jobs, setJobs] = useState<Job[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const fetchJobs = useCallback(async () => {
        try {
            const res = await jobService.getAll();
            const now = new Date();
            const processedJobs = res.data.map(job => {
                let currentStatus = job.status;
                if (currentStatus !== "CLOSED" && job.closedTime && new Date(job.closedTime) < now) {
                    currentStatus = "CLOSED";
                }
                return { ...job, status: currentStatus };
            });
            setJobs(processedJobs);
        } catch (err: any) {
            toastError("Error", "Could not fetch jobs.");
        }
    }, [toastError]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handleToggleStatus = async (e: React.MouseEvent, job: Job) => {
        e.stopPropagation();
        if (job.status === "CLOSED") return;

        let nextStatus: JobStatus = "CLOSED";
        if (job.status === "DRAFT") {
            nextStatus = "OPEN";
        } else if (job.status === "OPEN") {
            nextStatus = "CLOSED";
        }

        if (!window.confirm(`Are you sure you want to change status from ${job.status} to ${nextStatus}?`)) return;

        try {
            await jobService.updateStatus(job.id, nextStatus);
            setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: nextStatus } : j));
            toastSuccess("Success", `Job status updated to ${nextStatus}`);
        } catch (err) {
            toastError("Error", "Failed to update job status.");
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this job?")) return;
        try {
            await jobService.delete(id);
            setJobs(prev => prev.filter(j => j.id !== id));
            toastSuccess("Success", "Job deleted successfully");
        } catch (err) {
            toastError("Error", "Failed to delete job.");
        }
    };

    const filteredJobs = useMemo(() => {
        return jobs.filter(job =>
            job.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [jobs, searchTerm]);

    const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);

    const paginatedJobs = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredJobs.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredJobs, currentPage]);

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-text-primary-light tracking-tight">
                        Job Openings
                    </h1>
                    <p className="mt-0.5 text-sm text-text-secondary-light">
                        Manage your public job postings and recruitment progress
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search jobs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-xl border border-border-light bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-text-tertiary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button
                        onClick={() => navigate("/recruitment/jobs/new")}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                    >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                        </svg>
                        Post Job
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-border-light bg-white overflow-hidden shadow-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-white">
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary-light">Job Detail</th>
                                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary-light">Status</th>
                                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary-light">Dates</th>
                                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary-light">Applications</th>
                                <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary-light text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-xs">
                            {paginatedJobs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-text-secondary-light font-medium">
                                        {searchTerm ? `No jobs matching"${searchTerm}"` : "No job postings found."}
                                    </td>
                                </tr>
                            ) : (
                                paginatedJobs.map((job) => (
                                    <tr
                                        key={job.id}
                                        onClick={() => navigate(`/recruitment/jobs/${job.id}`)}
                                        className="group hover:bg-gray-50/80 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-text-primary-light text-sm mb-0.5">
                                                {job.title}
                                            </div>
                                            <div className="text-[10px] text-text-tertiary-light uppercase tracking-wide">
                                                ID: {job.id.substring(0, 8)}...
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <button
                                                onClick={(e) => handleToggleStatus(e, job)}
                                                disabled={job.status === "CLOSED"}
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${job.status === "CLOSED" ? "opacity-60 cursor-not-allowed bg-rose-50 text-rose-700 ring-rose-200" : "hover:ring-2 hover:ring-offset-1"
                                                    } ${job.status === "OPEN"
                                                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                                        : job.status === "DRAFT"
                                                            ? "bg-amber-50 text-amber-700 ring-amber-200"
                                                            : ""
                                                    }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${job.status === "OPEN" ? "bg-emerald-500" : job.status === "DRAFT" ? "bg-amber-500" : "bg-rose-500"
                                                    }`}></span>
                                                {job.status}
                                            </button>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] text-text-tertiary-light w-8">Start:</span>
                                                    <span className="text-text-secondary-light">
                                                        {job.createAt ? new Date(job.createAt).toLocaleDateString() : "—"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-rose-600/80">
                                                    <span className="text-[10px] text-text-tertiary-light w-8">End:</span>
                                                    <span>
                                                        {job.closedTime ? new Date(job.closedTime).toLocaleDateString() : "—"}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/recruitment/cvs?jobId=${job.id}`);
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-text-secondary-light font-medium transition-all group/btn"
                                            >
                                                <svg className="w-4 h-4 text-text-tertiary-light group-hover/btn:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                List CV
                                            </button>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 text-text-tertiary-light">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/recruitment/jobs/edit/${job.id}`);
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all title='Change'"
                                                >
                                                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                {job.status === "DRAFT" && (
                                                    <button
                                                        onClick={(e) => handleDelete(e, job.id)}
                                                        className="p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all title='Delete'"
                                                    >
                                                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Bar */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 bg-gray-50/30">
                        <div className="text-xs text-text-tertiary-light">
                            Showing <span className="font-semibold text-text-secondary-light">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-semibold text-text-secondary-light">{Math.min(currentPage * ITEMS_PER_PAGE, filteredJobs.length)}</span> of <span className="font-semibold text-text-secondary-light">{filteredJobs.length}</span> results
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-border-light disabled:opacity-30 disabled:pointer-events-none transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${currentPage === i + 1
                                        ? "bg-primary text-white shadow-sm"
                                        : "hover:bg-white border border-transparent hover:border-border-light text-text-secondary-light"
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-border-light disabled:opacity-30 disabled:pointer-events-none transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobListPage;
