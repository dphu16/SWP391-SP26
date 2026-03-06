import React, { useState, useEffect, useMemo, useCallback } from "react";
import { jobService } from "../../services/jobService";
import { applicationService } from "../../services/applicationService";
import type { Job } from "../ui/types";
import { useToast } from "../ui/Toast";

const ITEMS_PER_PAGE = 6;

const PublicJobList: React.FC = () => {
    const { error: toastError, success: toastSuccess } = useToast();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [applicantName, setApplicantName] = useState("");
    const [applicantEmail, setApplicantEmail] = useState("");
    const [applicantPhone, setApplicantPhone] = useState("");
    const [applicantCv, setApplicantCv] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        setSelectedJob(job);
        setIsApplyModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsApplyModalOpen(false);
        setSelectedJob(null);
        setApplicantName("");
        setApplicantEmail("");
        setApplicantPhone("");
        setApplicantCv(null);
    };

    const handleSubmitApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedJob) return;

        if (!applicantName || !applicantEmail || !applicantPhone || !applicantCv) {
            toastError("Validation Error", "Please fill in all fields and attach a CV.");
            return;
        }

        try {
            setIsSubmitting(true);

            const formData = new FormData();
            formData.append("jobId", selectedJob.id);
            formData.append("fullName", applicantName);
            formData.append("email", applicantEmail);
            formData.append("phone", applicantPhone);
            formData.append("cvUrl", applicantCv);

            await applicationService.applyJob(formData);

            toastSuccess("Success", "Your application has been submitted successfully!");
            handleCloseModal();
        } catch (err: any) {
            toastError("Error", "Could not submit application. Please try again later.");
        } finally {
            setIsSubmitting(false);
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

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
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
                        placeholder="Search open positions..."
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
                    <div className="grid gap-4">
                        {paginatedJobs.map((job) => (
                            <div key={job.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold text-gray-900">{job.title}</h2>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Closing: {job.closedTime ? new Date(job.closedTime).toLocaleDateString() : "Open until filled"}
                                        </div>
                                    </div>
                                </div>
                                <button className="self-start sm:self-center px-6 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-colors shadow-sm" onClick={() => handleApplyClick(job)}>
                                    Apply Now
                                </button>
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

                {/* Apply Job Modal */}
                {isApplyModalOpen && selectedJob && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity animate-fade-in">
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="text-xl font-bold text-gray-900">
                                    Apply for {selectedJob.title}
                                </h3>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <form onSubmit={handleSubmitApplication} className="p-6 space-y-5">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={applicantName}
                                        onChange={(e) => setApplicantName(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={applicantEmail}
                                        onChange={(e) => setApplicantEmail(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                    <input
                                        type="tel"
                                        required
                                        value={applicantPhone}
                                        onChange={(e) => setApplicantPhone(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="+1 234 567 890"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">CV (PDF only)</label>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        required
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setApplicantCv(e.target.files[0]);
                                            }
                                        }}
                                        className="w-full px-3 py-2 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all border border-gray-200 rounded-xl bg-white shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>

                                <div className="pt-4 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 shadow-sm"
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-5 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Submitting...
                                            </>
                                        ) : (
                                            "Submit Application"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicJobList;
