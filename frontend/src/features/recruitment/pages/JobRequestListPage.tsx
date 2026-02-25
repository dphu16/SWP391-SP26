import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jobRequestService } from "../services/jobRequestService";
import type { JobRequest } from "../types";
import { LoadingSpinner, ErrorMessage } from "../components/StatusDisplay";
import { DeleteConfirmation } from "../components/DeleteConfirmation";
import { useToast } from "../../../shared/components/ui/Toast";

const JobRequestListPage: React.FC = () => {
    const navigate = useNavigate();
    const { error: toastError, success: toastSuccess } = useToast();

    const [requests, setRequests] = useState<JobRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await jobRequestService.getAll();
            setRequests(res.data);
        } catch (err: any) {
            setError("Failed to load job requests. Please try again later.");
            toastError("Error", "Could not fetch job requests.");
        } finally {
            setLoading(false);
        }
    }, [toastError]);

    useEffect(() => {
        fetchRequests();
        console.log("REQUESTS DATA:", requests);
    }, [fetchRequests]);

    const handleDeleteClick = (id: string) => {
        setRequestToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!requestToDelete) return;
        try {
            setIsDeleting(true);
            await jobRequestService.delete(requestToDelete);
            toastSuccess("Deleted", "Job request has been deleted successfully.");
            setRequests(prev => prev.filter(r => r.id !== requestToDelete));
        } catch (err) {
            toastError("Error", "Could not delete job request.");
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
            setRequestToDelete(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-text-primary-light dark:text-text-primary-dark tracking-tight">
                        Job Requests
                    </h1>
                    <p className="mt-0.5 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        Internal hiring requests from departments
                    </p>
                </div>
                <button
                    onClick={() => navigate("/recruitment/job-requests/new")}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors cursor-pointer shadow-sm btn-primary-action"
                >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    Post Job Request
                </button>
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : error ? (
                <ErrorMessage message={error} />
            ) : (
                <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark overflow-hidden shadow-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1200px]">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-800/30">
                                    <th className="px-4 py-4 text-[10px] font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">ID</th>
                                    <th className="px-4 py-4 text-[10px] font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">Title</th>
                                    <th className="px-4 py-4 text-[10px] font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">Dept</th>
                                    <th className="px-4 py-4 text-[10px] font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark text-center">Qty</th>
                                    <th className="px-4 py-4 text-[10px] font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">Location</th>
                                    <th className="px-4 py-4 text-[10px] font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">Type</th>
                                    <th className="px-4 py-4 text-[10px] font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">Reports To</th>
                                    <th className="px-4 py-4 text-[10px] font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">Status</th>
                                    <th className="px-4 py-4 text-[10px] font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/40 text-xs">
                                {requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-text-secondary-light dark:text-text-secondary-dark font-medium">
                                            No job requests found.
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((req) => (
                                        <tr key={req.id} className="group hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-4 py-4 font-mono text-[10px] text-text-muted-light dark:text-text-muted-dark">
                                                {req.id.slice(0, 8)}...
                                            </td>
                                            <td className="px-4 py-4 font-semibold text-text-primary-light dark:text-text-primary-dark">
                                                {req.title}
                                            </td>
                                            <td className="px-4 py-4 text-text-secondary-light dark:text-text-secondary-dark">
                                                {req.deptId}
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold text-text-primary-light dark:text-text-primary-dark">
                                                {req.quantity}
                                            </td>
                                            <td className="px-4 py-4 text-text-secondary-light dark:text-text-secondary-dark">
                                                {req.location}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-[10px] font-medium">
                                                    {req.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-text-secondary-light dark:text-text-secondary-dark">
                                                {req.reportTo || "—"}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${req.status === "PENDING" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" :
                                                    req.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" :
                                                        req.status === "REJECTED" ? "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400" :
                                                            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                                    }`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => navigate(`/recruitment/job-requests/${req.id}/edit`)}
                                                        className="p-1.5 rounded-lg text-text-secondary-light hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                                    >
                                                        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                                                            <path d="M11.013 2.513a1.75 1.75 0 012.475 2.474L6.226 12.25a2.751 2.751 0 01-.892.596l-2.047.848a.75.75 0 01-.98-.98l.848-2.047a2.75 2.75 0 01.596-.892l7.262-7.262z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(req.id)}
                                                        className="p-1.5 rounded-lg text-text-secondary-light hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                    >
                                                        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                                                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75V4H2.75a.75.75 0 000 1.5h.354l.863 8.104A2.75 2.75 0 006.706 16h2.588a2.75 2.75 0 002.739-2.396l.863-8.104h.354a.75.75 0 000-1.5H10v-.25A2.75 2.75 0 007.25 1h1.5zM9 4V3.75a1.25 1.25 0 00-2.5 0V4H9zm-3.5 1.5h5l-.856 8.046a1.25 1.25 0 01-1.245 1.054H6.706a1.25 1.25 0 01-1.245-1.054L5.5 5.5z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
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

            <DeleteConfirmation
                isOpen={isDeleteModalOpen}
                onCancel={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
                title="Delete Job Request"
                message="Are you sure you want to delete this job request? This action cannot be undone."
            />
        </div>
    );
};

export default JobRequestListPage;
