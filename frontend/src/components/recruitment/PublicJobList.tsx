import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jobService } from "../../services/jobService";
import type { Job } from "../ui/types";
import { useToast } from "../ui/Toast";

const ITEMS_PER_PAGE = 6;

const formatTimeLeft = (closedTime: string | null) => {
    if (!closedTime) return "Open until filled";
    const closeDate = new Date(closedTime);
    const now = new Date();
    const diffMs = closeDate.getTime() - now.getTime();
    if (diffMs <= 0) return "Closed";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours > 24) {
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} days left`;
    }
    return `${diffHours} hours left`;
};

const PublicJobList: React.FC = () => {
    const { error: toastError } = useToast();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchJobs = useCallback(async () => {
        try {
            setLoading(true);
            const res = await jobService.getAll();
            const now = new Date();
            // Filter and process only OPEN jobs
            const openJobs = res.data.filter(job => {
                let currentStatus = job.status;
                if (currentStatus !== "CLOSED" && job.closedTime && new Date(job.closedTime) < now) {
                    currentStatus = "CLOSED";
                }
                return currentStatus === "OPEN";
            });
            setJobs(openJobs);
        } catch (err: any) {
            toastError("Error", "Could not fetch jobs.");
        } finally {
            setLoading(false);
        }
    }, [toastError]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handleApplyClick = (job: Job) => {
        navigate(`/careers/${job.id}`);
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

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="h-full overflow-y-auto bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Open Positions</h1>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                        Join our team and help us build the future. Explore our current open roles below.
                    </p>
                </div>

                <div className="relative max-w-xl mx-auto">
                    <input
                        type="text"
                        placeholder="Search jobs by title"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900"
                    />
                    <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : paginatedJobs.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <div className="text-gray-400 mb-2">
                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No open jobs found</h3>
                        <p className="mt-1 text-gray-500">We are not recruiting for any matching positions right now. Please check back later.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paginatedJobs.map((job) => (
                            <div key={job.id} onClick={() => handleApplyClick(job)} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4 cursor-pointer">
                                <div className="space-y-3">
                                    <h2 className="text-xl font-bold text-gray-900">{job.title}</h2>

                                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                            <span className="font-semibold">{job.type || "FULL_TIME"}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-gray-50 text-gray-700 px-2 py-1 rounded">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {job.location || "Anywhere"}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                        <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2 py-1 rounded">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {job.salary || "Negotiable"}
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-2 py-1 rounded">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {formatTimeLeft(job.closedTime)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30 disabled:pointer-events-none transition-all text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="text-sm font-medium text-gray-600">Page {currentPage} of {totalPages}</span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30 disabled:pointer-events-none transition-all text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicJobList;
