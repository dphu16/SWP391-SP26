import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { jobRequestService } from "../../services/jobRequestService";
import type { JobRequest } from "../ui/types";
import { LoadingSpinner, ErrorMessage } from "./StatusDisplay";
import { DeleteConfirmation } from "./DeleteConfirmation";
import { useToast } from "../ui/Toast";

const JobRequestListPage: React.FC = () => {
    const navigate = useNavigate();
    const { error: toastError, success: toastSuccess } = useToast();

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

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
    }, [fetchRequests]);

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setRequestToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleEditClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        navigate(`/recruitment/job-requests/${id}/edit`);
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

    // Filter and Paginate
    const filteredRequests = requests.filter(req =>
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.deptName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.reviewer && req.reviewer.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    const currentItems = filteredRequests.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-text-primary-light tracking-tight">
                        Job Requests
                    </h1>
                    <p className="mt-0.5 text-sm font-medium text-text-secondary-light">
                        <Link to="/dashboard" className="hover:text-primary transition-colors">Home</Link>
                        <span className="mx-2">&gt;</span>
                        <span className="text-text-primary-light">Job Requests</span>
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

            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-border-light shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Search by title, department, or report to..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-border-light bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm h-10"
                    />
                </div>
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : error ? (
                <ErrorMessage message={error} />
            ) : (
                <div className="space-y-4">
                    <div className="rounded-2xl border border-border-light bg-white overflow-hidden shadow-card">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-white">
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-text-secondary-light">Title</th>
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-text-secondary-light">Department</th>
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-text-secondary-light">Report To</th>
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-text-secondary-light">Status</th>
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-text-secondary-light text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm">
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-text-secondary-light font-medium">
                                                No job requests found.
                                            </td>
                                        </tr>
                                    ) : (
                                        currentItems.map((req) => (
                                            <tr
                                                key={req.id}
                                                onClick={() => navigate(`/recruitment/job-requests/${req.id}`)}
                                                className="group hover:bg-gray-50/80 transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-text-primary-light">
                                                        {req.title}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-text-secondary-light">
                                                    {req.deptName}
                                                </td>
                                                <td className="px-6 py-4 text-text-secondary-light">
                                                    {req.reviewer || "—"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${req.status === "SUBMITTED" ? "bg-amber-50 text-amber-700" :
                                                        req.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" :
                                                            req.status === "REJECTED" ? "bg-rose-50 text-rose-700" :
                                                                "bg-gray-100 text-gray-700"
                                                        }`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {req.status === "SUBMITTED" && (
                                                        <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => handleEditClick(e, req.id)}
                                                                title="Change"
                                                                className="p-2 rounded-lg text-text-secondary-light hover:text-primary hover:bg-primary/10 transition-all cursor-pointer bg-white"
                                                            >
                                                                <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                                                                    <path d="M11.013 2.513a1.75 1.75 0 012.475 2.474L6.226 12.25a2.751 2.751 0 01-.892.596l-2.047.848a.75.75 0 01-.98-.98l.848-2.047a2.75 2.75 0 01.596-.892l7.262-7.262z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeleteClick(e, req.id)}
                                                                title="Delete"
                                                                className="p-2 rounded-lg text-text-secondary-light hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer bg-white"
                                                            >
                                                                <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                                                                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75V4H2.75a.75.75 0 000 1.5h.354l.863 8.104A2.75 2.75 0 006.706 16h2.588a2.75 2.75 0 002.739-2.396l.863-8.104h.354a.75.75 0 000-1.5H10v-.25A2.75 2.75 0 007.25 1h1.5zM9 4V3.75a1.25 1.25 0 00-2.5 0V4H9zm-3.5 1.5h5l-.856 8.046a1.25 1.25 0 01-1.245 1.054H6.706a1.25 1.25 0 01-1.245-1.054L5.5 5.5z" clipRule="evenodd" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold transition-all cursor-pointer ${currentPage === page
                                        ? "bg-primary text-white shadow-md shadow-primary/20"
                                        : "bg-white text-text-secondary-light border border-border-light hover:border-primary hover:text-primary"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    )}
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
