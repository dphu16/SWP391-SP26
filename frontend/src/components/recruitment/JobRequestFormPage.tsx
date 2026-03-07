import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { jobRequestService } from "../../services/jobRequestService";
import type { JobRequestInput } from "../ui/types";
import { LoadingSpinner, ErrorMessage } from "./StatusDisplay";
import { useToast } from "../ui/Toast";
import { departmentService } from "../../services/departmentService";
import type { Department } from "../../services/departmentService";
import { hrService } from "../../services/hrService";
import type { EmployeeNameDto } from "../../services/hrService";

const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl border border-border-light bg-white text-text-primary-light focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-text-secondary-light mb-1.5";

const JobRequestFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { error: toastError, success: toastSuccess } = useToast();

    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<EmployeeNameDto[]>([]);

    const [formData, setFormData] = useState<JobRequestInput>({
        title: "",
        deptId: "",
        quantity: 1,
        location: "",
        type: "FULL_TIME",
        reportTo: "",
        reason: "",
        status: "SUBMITTED",
        comment: "",
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch departments and employees
                const [deptRes, empRes] = await Promise.all([
                    departmentService.getAll(),
                    hrService.getEmployeeNames()
                ]);
                setDepartments(deptRes.data);
                setEmployees(empRes.data);

                if (isEdit && id) {
                    const res = await jobRequestService.getById(id);
                    setFormData(res.data);
                }
            } catch (err) {
                setError("Failed to load necessary data.");
                toastError("Error", "Could not fetch details.");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [id, isEdit, toastError]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "quantity" ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const payload = { ...formData, status: "SUBMITTED" as const };
            if (isEdit && id) {
                await jobRequestService.update(id, payload);
                toastSuccess("Updated", "Job request updated successfully.");
            } else {
                await jobRequestService.create(payload);
                toastSuccess("Created", "Job request created successfully.");
            }
            navigate("/recruitment/job-requests");
        } catch (err) {
            toastError("Error", "Failed to save job request.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-heading text-text-primary-light tracking-tight">
                        {isEdit ? "Update Job Request" : "Post Job Request"}
                    </h1>
                    <p className="text-sm font-medium text-text-secondary-light mb-2">
                        <Link to="/dashboard" className="hover:text-primary transition-colors">Home</Link>
                        <span className="mx-2">&gt;</span>
                        <Link to="/recruitment/job-requests" className="hover:text-primary transition-colors">Job Requests</Link>
                        <span className="mx-2">&gt;</span>
                        <span className="text-text-primary-light">{isEdit ? "Update Request" : "New Request"}</span>
                    </p>
                </div>
            </div>

            {error && <ErrorMessage message={error} />}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-2xl border border-border-light bg-white shadow-card p-6 md:p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelCls}>Job Title</label>
                            <input
                                required
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Senior Product Designer"
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Report To HR</label>
                            <select
                                required
                                name="reportTo"
                                value={formData.reportTo}
                                onChange={handleChange}
                                className={inputCls}
                            >
                                <option value="" disabled>Select a HR</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.fullName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelCls}>Department</label>
                            <select
                                required
                                name="deptId"
                                value={formData.deptId}
                                onChange={handleChange}
                                className={inputCls}
                            >
                                <option value="" disabled>Select a department</option>
                                {departments.map(dept => (
                                    <option key={dept.deptId} value={dept.deptId}>
                                        {dept.deptName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelCls}>Quantity</label>
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
                            <label className={labelCls}>Work Location</label>
                            <input
                                required
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g. Hanoi"
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Employment Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className={inputCls}
                            >
                                <option value="FULL_TIME">Full-time</option>
                                <option value="PART_TIME">Part-time</option>
                                <option value="CONTRACT">Contract</option>
                                <option value="INTERN">Internship</option>
                            </select>
                        </div>





                        <div className="md:col-span-2">
                            <label className={labelCls}>Reason</label>
                            <textarea
                                required
                                name="reason"
                                rows={4}
                                value={formData.reason}
                                onChange={handleChange}
                                placeholder="Explain why this position is needed..."
                                className={`${inputCls} resize-none`}
                            />
                        </div>


                    </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-2.5 rounded-xl border border-border-light text-sm font-semibold text-text-secondary-light hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {isEdit ? "Update Request" : "Submit Request"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default JobRequestFormPage;
