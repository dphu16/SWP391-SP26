import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { applicationService } from "../../services/applicationService";
import type { Application } from "../../types";
import { LoadingSpinner, ErrorMessage } from "./StatusDisplay";
import { useToast } from "../ui/Toast";

const CVListPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const jobId = searchParams.get("jobId");
    const navigate = useNavigate();
    const { error: toastError, success: toastSuccess } = useToast();

    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            toastSuccess("Success", `Status updated to ${newStatus}`);
        } catch (err) {
            toastError("Error", "Failed to update status");
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl text-text-secondary-light hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <svg viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold font-heading text-text-primary-light tracking-tight">
                            List of CVs for Job
                        </h1>
                        <p className="mt-0.5 text-sm text-text-secondary-light">
                            Manage candidate applications
                        </p>
                    </div>
                </div>
            </div>

            {error && <ErrorMessage message={error} />}

            {!error && (
                <div className="rounded-2xl border border-border-light bg-white overflow-hidden shadow-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-white">
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary-light">Candidate Info</th>
                                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary-light">CV URL</th>
                                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary-light">Status</th>
                                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary-light text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-xs">
                                {applications.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-text-secondary-light font-medium">
                                            No candidates found for this job.
                                        </td>
                                    </tr>
                                ) : (
                                    applications.map((app) => (
                                        <tr key={app.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-text-primary-light text-sm mb-0.5">
                                                    {app.candidateName || "Unknown Candidate"}
                                                </div>
                                                <div className="text-[10px] text-text-tertiary-light break-all">
                                                    {app.candidateEmail} <br /> {app.candidatePhone}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {app.cvUrl ? (
                                                    <a
                                                        href={app.cvUrl}
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
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400 italic">No CV available</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 tracking-wide uppercase">
                                                    {app.status || "NEW"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 text-text-tertiary-light">
                                                    <select
                                                        className="px-2 py-1 text-xs border rounded-lg focus:outline-none focus:border-primary cursor-pointer bg-white"
                                                        value={app.status || "NEW"}
                                                        onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                                                    >
                                                        <option value="NEW">New</option>
                                                        <option value="REVIEWING">Reviewing</option>
                                                        <option value="INTERVIEWING">Interviewing</option>
                                                        <option value="OFFERED">Offered</option>
                                                        <option value="HIRED">Hired</option>
                                                        <option value="REJECTED">Rejected</option>
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CVListPage;
