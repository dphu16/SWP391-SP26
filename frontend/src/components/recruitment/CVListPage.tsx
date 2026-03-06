import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { applicationService } from "../../services/applicationService";
import type { Application } from "../../types";
import { LoadingSpinner, ErrorMessage } from "./StatusDisplay";
import { useToast } from "../ui/Toast";

const CVListPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const jobId = searchParams.get("jobId");

    const { error: toastError, success: toastSuccess } = useToast();

    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingStatusId, setEditingStatusId] = useState<string | null>(null);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<"CREATE" | "UPDATE">("CREATE");
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [applicantName, setApplicantName] = useState("");
    const [applicantEmail, setApplicantEmail] = useState("");
    const [applicantPhone, setApplicantPhone] = useState("");
    const [applicantCv, setApplicantCv] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOpenCreateModal = () => {
        setFormMode("CREATE");
        setSelectedApp(null);
        setApplicantName("");
        setApplicantEmail("");
        setApplicantPhone("");
        setApplicantCv(null);
        setIsFormModalOpen(true);
    };

    const handleOpenUpdateModal = (app: Application) => {
        setFormMode("UPDATE");
        setSelectedApp(app);
        setApplicantName(app.fullName || "");
        setApplicantEmail(app.email || "");
        setApplicantPhone(app.phone || "");
        setApplicantCv(null);
        setIsFormModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsFormModalOpen(false);
        setSelectedApp(null);
    };

    const handleSubmitCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!jobId && formMode === "CREATE") {
            toastError("Error", "Missing job ID.");
            return;
        }

        if (!applicantName || !applicantEmail || !applicantPhone) {
            toastError("Validation Error", "Please fill in all required fields.");
            return;
        }

        if (formMode === "CREATE" && !applicantCv) {
            toastError("Validation Error", "Please attach a CV.");
            return;
        }

        try {
            setIsSubmitting(true);
            const formData = new FormData();
            if (formMode === "CREATE") {
                formData.append("jobId", jobId as string);
            } else if (selectedApp) {
                formData.append("jobId", selectedApp.jobId);
            }
            formData.append("fullName", applicantName);
            formData.append("email", applicantEmail);
            formData.append("phone", applicantPhone);
            if (applicantCv) {
                formData.append("cvUrl", applicantCv);
            }

            if (formMode === "CREATE") {
                await applicationService.applyJob(formData);
                toastSuccess("Success", "Candidate created successfully!");
            } else if (selectedApp) {
                await applicationService.updateApplication(selectedApp.id, formData);
                toastSuccess("Success", "Candidate updated successfully!");
            }

            handleCloseModal();
            // Refresh list
            if (jobId) {
                const res = await applicationService.getByJobId(jobId);
                setApplications(res.data);
            }
        } catch (err: any) {
            toastError("Error", "Could not submit candidate data.");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (!jobId) {
            setError("No Job ID provided.");
            setLoading(false);
            return;
        }

        const fetchApplications = async () => {
            try {
                setLoading(true);
                const res = await applicationService.getByJobId(jobId);
                setApplications(res.data);
            } catch (err) {
                setError("Failed to fetch candidates/CVs.");
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, [jobId]);

    const handleUpdateStatus = async (appId: string, newStatus: string) => {
        try {
            await applicationService.updateStatus(appId, newStatus);
            setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
            setEditingStatusId(null);
            toastSuccess("Success", `Status updated to ${newStatus} `);
        } catch (err) {
            toastError("Error", "Failed to update status");
        }
    };

    const handleDeleteApplication = async (appId: string) => {
        if (!window.confirm("Are you sure you want to delete this CV?")) return;
        try {
            await applicationService.deleteApplication(appId);
            setApplications(prev => prev.filter(a => a.id !== appId));
            toastSuccess("Success", "CV deleted successfully");
        } catch (err) {
            toastError("Error", "Failed to delete CV");
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-heading text-text-primary-light tracking-tight">
                            List of {applications.length > 0 && applications[0].jobTitle ? applications[0].jobTitle : "for Job"}
                        </h1>
                        <p className="mt-0.5 text-sm font-medium text-text-secondary-light mb-2">
                            <Link to="/dashboard" className="hover:text-primary transition-colors">Home</Link>
                            <span className="mx-2">&gt;</span>
                            <Link to="/recruitment/jobs" className="hover:text-primary transition-colors">Job Postings</Link>
                            <span className="mx-2">&gt;</span>
                            <span className="text-text-primary-light">Applications</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        />
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button
                        onClick={handleOpenCreateModal}
                        className="px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-colors shadow-sm whitespace-nowrap"
                    >
                        Create Candidate
                    </button>
                </div>
            </div>

            {error && <ErrorMessage message={error} />}

            {!error && (
                <div className="rounded-2xl border border-border-light bg-white overflow-hidden shadow-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-white">
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary-light">Full Name</th>
                                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary-light">Phone</th>
                                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary-light">CV URL</th>
                                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary-light">Status</th>
                                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary-light text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-xs">
                                {applications.filter(app =>
                                    app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    app.email.toLowerCase().includes(searchTerm.toLowerCase())
                                ).length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-text-secondary-light font-medium">
                                            No candidates found for this job.
                                        </td>
                                    </tr>
                                ) : (
                                    applications.filter(app =>
                                        app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        app.email.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).map((app) => (
                                        <tr key={app.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-text-primary-light text-sm mb-0.5">
                                                    {app.fullName || "Unknown Candidate"}
                                                </div>
                                                <div className="text-[10px] text-text-tertiary-light break-all">
                                                    {app.email}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-text-secondary-light">
                                                {app.phone || "-"}
                                            </td>
                                            <td className="px-4 py-4">
                                                {app.cvUrl ? (
                                                    <a
                                                        href={`http://localhost:8080${app.cvUrl}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex flex-col gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-all"
                                                    >
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                            View CV
                                                        </span>
                                                    </a >
                                                ) : (
                                                    <span className="text-gray-400 italic">No CV available</span>
                                                )}
                                            </td >
                                            <td className="px-4 py-4">
                                                {editingStatusId === app.id ? (
                                                    <select
                                                        className="px-2 py-1 text-xs border rounded-lg focus:outline-none focus:border-primary cursor-pointer bg-white"
                                                        value={app.status || "NEW"}
                                                        onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                                                        onBlur={() => setEditingStatusId(null)}
                                                        autoFocus
                                                    >
                                                        <option value="NEW">New</option>
                                                        <option value="REVIEWING">Reviewing</option>
                                                        <option value="INTERVIEWING">Interviewing</option>
                                                        <option value="OFFERED">Offered</option>
                                                        <option value="HIRED">Hired</option>
                                                        <option value="REJECTED">Rejected</option>
                                                    </select>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 tracking-wide uppercase">
                                                        {app.status || "NEW"}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 text-text-tertiary-light">
                                                    <button
                                                        onClick={() => handleOpenUpdateModal(app)}
                                                        className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                                                        title="Update Candidate Info"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteApplication(app.id)}
                                                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete CV"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr >
                                    ))
                                )}
                            </tbody >
                        </table >
                    </div >
                </div >
            )}

            {/* Candidate Form Modal */}
            {
                isFormModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity animate-fade-in">
                        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {formMode === "CREATE" ? "Create Candidate" : "Update Candidate"}
                                </h3>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <form onSubmit={handleSubmitCandidate} className="p-6 space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                                    <div className="space-y-1 flex flex-col justify-end">
                                        <label className="text-sm font-medium text-gray-700 mb-1">
                                            CV (PDF only) {formMode === "UPDATE" && <span className="text-gray-400 font-normal ml-1">(Leave blank to keep current)</span>}
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            required={formMode === "CREATE"}
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files.length > 0) {
                                                    setApplicantCv(e.target.files[0]);
                                                }
                                            }}
                                            className="w-full px-3 py-2 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all border border-gray-200 rounded-xl bg-white shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary line-clamp-1"
                                        />
                                    </div>
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
                                                Saving...
                                            </>
                                        ) : (
                                            formMode === "CREATE" ? "Create Candidate" : "Update Candidate"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default CVListPage;
