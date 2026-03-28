import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jobRequestService } from "../../services/jobRequestService";
import type { JobRequest } from "../ui/types";
import { LoadingSpinner, ErrorMessage } from "./StatusDisplay";
import { DeleteConfirmation } from "./DeleteConfirmation";
import { useToast } from "../ui/Toast";
import { useAuth } from "../../hooks/useAuth";
import { employeeService } from "../../services/employeeService";
const JobRequestListPage: React.FC = () => {
    const navigate = useNavigate();
    const { error: toastError, success: toastSuccess } = useToast();
    const { user } = useAuth();

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [requests, setRequests] = useState<JobRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<"SUBMITTED" | "APPROVED" | "REJECTED" | "UNASSIGNED">("SUBMITTED");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isChoosing, setIsChoosing] = useState(false);

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            if (user?.role === "MANAGER" && user.employeeId) {
                // Fetch employee detail to get department
                const employeeRes = await employeeService.getEmployeeDetail(user.employeeId);
                const deptName = employeeRes.data.deptName;

                if (deptName) {
                    // For managers, we don't have UNASSIGNED tab, but just in case
                    const status = selectedStatus === "UNASSIGNED" ? "SUBMITTED" : selectedStatus;
                    const reqRes = await jobRequestService.getByDepartment(deptName, status);
                    setRequests(reqRes.data);
                } else {
                    setRequests([]);
                }
            } else if (user?.role === "HR" && user.employeeId) {
                if (selectedStatus === "UNASSIGNED") {
                    // HR gets unassigned requests
                    const reqRes = await jobRequestService.getUnassignedSubmitted();
                    setRequests(reqRes.data);
                } else {
                    // HR gets their assigned requests by status
                    const reqRes = await jobRequestService.getByHR(user.employeeId, selectedStatus);
                    setRequests(reqRes.data);
                }
            } else {
                // Admin or others get all requests
                const res = await jobRequestService.getAll();
                // Filter by status since Admin API doesn't support backend filtering yet
                if (selectedStatus === "UNASSIGNED") {
                    setRequests(res.data.filter(r => r.status === "SUBMITTED" && !r.reviewer));
                } else {
                    setRequests(res.data.filter(r => r.status === selectedStatus));
                }
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Could not fetch job requests.";
            setError(msg);
            toastError("Error", msg);
        } finally {
            setLoading(false);
        }
    }, [toastError, user, selectedStatus]);

    useEffect(() => {
        fetchRequests();
        setSelectedIds([]); // Clear selection when status changes
    }, [fetchRequests, selectedStatus]);

    const handleCheckboxChange = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleChoiceRequest = async () => {
        if (!user?.employeeId || selectedIds.length === 0) return;
        try {
            setIsChoosing(true);
            await jobRequestService.choiceRequest(user.employeeId, selectedIds);
            toastSuccess("Assigned", `Successfully assigned ${selectedIds.length} requests to you.`);
            setSelectedIds([]);
            fetchRequests();
        } catch (err: any) {
            toastError("Error", err?.response?.data?.message || "Could not assign requests.");
        } finally {
            setIsChoosing(false);
        }
    };

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
        } catch (err: any) {
            toastError("Error", err?.response?.data?.message || "Could not delete job request.");
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
            setRequestToDelete(null);
        }
    };

    // Filter and Paginate
    const filteredRequests = requests.filter(req =>
        req.posName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-text-primary-light tracking-tight">
                        Job Requests
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border-light bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm h-10"
                        />
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
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-border-light shadow-sm">
                <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 flex-wrap">
                    {user?.role === "HR" && (
                        <button
                            onClick={() => {
                                setSelectedStatus("UNASSIGNED");
                                setCurrentPage(1);
                            }}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedStatus === "UNASSIGNED"
                                ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                                : "text-text-secondary-light hover:text-primary"
                                }`}
                        >
                            UNASSIGNED
                        </button>
                    )}
                    {(["SUBMITTED", "APPROVED", "REJECTED"] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => {
                                setSelectedStatus(status);
                                setCurrentPage(1);
                            }}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedStatus === status
                                ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                                : "text-text-secondary-light hover:text-primary"
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {selectedStatus === "UNASSIGNED" && selectedIds.length > 0 && (
                    <button
                        onClick={handleChoiceRequest}
                        disabled={isChoosing}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                    >
                        {isChoosing ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                        )}
                        Choice Request ({selectedIds.length})
                    </button>
                )}
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
                                        {selectedStatus === "UNASSIGNED" && (
                                            <th className="px-6 py-4 w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={currentItems.length > 0 && currentItems.every(r => selectedIds.includes(r.id))}
                                                    onChange={(e) => {
                                                        const ids = currentItems.map(r => r.id);
                                                        if (e.target.checked) {
                                                            setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
                                                        } else {
                                                            setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                />
                                            </th>
                                        )}
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-text-secondary-light">Position Title</th>
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-text-secondary-light">Department</th>
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-text-secondary-light">Report To</th>
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-text-secondary-light">Status</th>
                                        {user?.role !== "HR" && (
                                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-text-secondary-light text-right">Actions</th>
                                        )}
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
                                                onClick={() => {
                                                    if (selectedStatus !== "UNASSIGNED") {
                                                        navigate(`/recruitment/job-requests/${req.id}`);
                                                    }
                                                }}
                                                className={`group hover:bg-gray-50/80 transition-colors ${selectedStatus !== "UNASSIGNED" ? "cursor-pointer" : ""
                                                    } ${selectedIds.includes(req.id) ? "bg-primary/5" : ""
                                                    }`}
                                            >
                                                {selectedStatus === "UNASSIGNED" && (
                                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(req.id)}
                                                            onChange={() => handleCheckboxChange(req.id)}
                                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                        />
                                                    </td>
                                                )}
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-text-primary-light">
                                                        {req.posName}
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
                                                {user?.role !== "HR" && (
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
                                                )}
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
