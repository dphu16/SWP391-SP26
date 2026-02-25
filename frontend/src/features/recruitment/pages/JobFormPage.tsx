import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jobService } from "../services/jobService";
import type { JobInput } from "../types";
import { useToast } from "../../../shared/components/ui/Toast";
import { LoadingSpinner } from "../components/StatusDisplay";

const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-gray-900 text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-1.5";

const JobFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const { error: toastError, success: toastSuccess } = useToast();

    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState<{ show: boolean, status: string }>({ show: false, status: "" });

    const [formData, setFormData] = useState<JobInput>({
        requestId: "",
        title: "",
        description: "",
        responsibility: "",
        requirement: "",
        benefit: "",
        quantity: 1,
        status: "OPEN",
        closedTime: "",
        hrId: "01111111-1111-1111-1111-111111111111",
    });

    useEffect(() => {
        if (isEdit && id) {
            const fetchJob = async () => {
                try {
                    const res = await jobService.getById(id);
                    const job = res.data;
                    setFormData({
                        requestId: job.reqId || "REQ-001",
                        title: job.title,
                        description: job.description,
                        responsibility: job.responsibility,
                        requirement: job.requirement,
                        benefit: job.benefit,
                        quantity: job.quantity,
                        status: job.status,
                        closedTime: job.closedTime ? job.closedTime.substring(0, 10) : "",
                        hrId: job.hrId || "admin-001",
                    });
                } catch (err) {
                    toastError("Error", "Failed to fetch job details.");
                    navigate("/recruitment/jobs");
                } finally {
                    setLoading(false);
                }
            };
            fetchJob();
        }
    }, [id, isEdit, navigate, toastError]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "quantity" ? parseInt(value) || 0 : value
        }));
    };

    const handleAction = (status: string) => {
        setShowConfirm({ show: true, status });
    };

    const confirmAction = async () => {
        const status = showConfirm.status;
        setShowConfirm({ show: false, status: "" });

        try {
            setSubmitting(true);
            // Format closedTime to ISO string for backend OffsetDateTime
            const finalData = {
                ...formData,
                status,
                closedTime: formData.closedTime ? new Date(formData.closedTime).toISOString() : ""
            };
            if (isEdit && id) {
                await jobService.update(id, finalData);
                toastSuccess("Success", "Job opening has been updated successfully.");
            } else {
                await jobService.create(finalData);
                toastSuccess(
                    status === "DRAFT" ? "Draft Saved" : "Job Posted",
                    `Job opening has been ${status === "DRAFT" ? "saved as draft" : "posted"} successfully.`
                );
            }
            navigate("/recruitment/jobs");
        } catch (err) {
            toastError("Error", `Failed to ${isEdit ? 'update' : (status === "DRAFT" ? "save draft" : "post job")}.`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="py-20"><LoadingSpinner /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in relative">
            {/* Confirmation Modal */}
            {showConfirm.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-surface-light dark:bg-surface-dark p-8 rounded-2xl shadow-2xl max-w-sm w-full mx-4 border border-border-light dark:border-border-dark">
                        <h3 className="text-xl font-bold mb-2">Confirm Action</h3>
                        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
                            Are you sure you want to {isEdit ? "update" : (showConfirm.status === "DRAFT" ? "save this as a draft" : "post")} this job opening?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirm({ show: false, status: "" })}
                                className="px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAction}
                                className={`px-6 py-2 rounded-xl text-sm font-bold text-white transition-all cursor-pointer ${showConfirm.status === "DRAFT" ? "bg-amber-500 hover:bg-amber-600" : "bg-primary hover:bg-primary-hover"
                                    }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-xl text-text-secondary-light hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z" clipRule="evenodd" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-2xl font-bold font-heading text-text-primary-light dark:text-text-primary-dark tracking-tight">
                        {isEdit ? "Edit Job Posting" : "Create Job Posting"}
                    </h1>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {isEdit ? "Modify the details of the job opening" : "Fill in the details to create a new job opening"}
                    </p>
                </div>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-card p-6 md:p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className={labelCls}>Job Title</label>
                            <input
                                required
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Lead Software Engineer"
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Quantity (Vacancies)</label>
                            <input
                                required
                                type="number"
                                min="1"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Closing Date</label>
                            <input
                                required
                                type="date"
                                name="closedTime"
                                value={formData.closedTime}
                                onChange={handleChange}
                                className={inputCls}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelCls}>Job Description</label>
                            <textarea
                                required
                                name="description"
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Brief overview of the role..."
                                className={`${inputCls} resize-none`}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelCls}>Key Responsibilities</label>
                            <textarea
                                required
                                name="responsibility"
                                rows={4}
                                value={formData.responsibility}
                                onChange={handleChange}
                                placeholder="What will they do day-to-day?"
                                className={`${inputCls} resize-none`}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelCls}>Candidate Requirements</label>
                            <textarea
                                required
                                name="requirement"
                                rows={4}
                                value={formData.requirement}
                                onChange={handleChange}
                                placeholder="Skills, experience, certifications..."
                                className={`${inputCls} resize-none`}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelCls}>Benefits & Perks</label>
                            <textarea
                                required
                                name="benefit"
                                rows={4}
                                value={formData.benefit}
                                onChange={handleChange}
                                placeholder="Why join us? Insurance, banner, etc..."
                                className={`${inputCls} resize-none`}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pb-10">
                    <button
                        type="button"
                        onClick={() => navigate("/recruitment/jobs")}
                        className="px-6 py-2.5 rounded-xl border border-border-light dark:border-border-dark text-sm font-semibold text-text-secondary-light hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    {!isEdit && (
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleAction("DRAFT")}
                            className="px-6 py-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 text-sm font-bold hover:bg-amber-100 transition-all cursor-pointer disabled:opacity-50"
                        >
                            Save as Draft
                        </button>
                    )}
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleAction(formData.status)}
                        className="px-8 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {isEdit ? "Update Job" : "Post Job"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default JobFormPage;
