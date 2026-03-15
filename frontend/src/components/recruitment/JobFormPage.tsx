import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { jobService } from "../../services/jobService";
import type { JobInput } from "../ui/types";
import { LoadingSpinner, ErrorMessage } from "./StatusDisplay";
import { useToast } from "../ui/Toast";
import { useAuth } from "../../hooks/useAuth";
import { departmentService } from "../../services/departmentService";
import type { Position, Department } from "../../services/departmentService";

const inputCls = "w-full px-4 py-2.5 text-sm rounded-xl border border-border-light bg-white text-text-primary-light focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-text-secondary-light mb-1.5";

const JobFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as any;

    const { error: toastError, success: toastSuccess } = useToast();
    const { user } = useAuth();

    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [selectedDeptId, setSelectedDeptId] = useState<string>(state?.deptId || "");

    const [formData, setFormData] = useState<JobInput>({
        requestId: state?.requestId || "",
        posId: state?.posId || "",
        description: "",
        responsibility: "",
        requirement: "",
        benefit: "",
        quantity: state?.quantity || 1,
        maxCv: 50,
        type: state?.type === "FULL_TIME" ? "OFFICIAL" : (state?.type || "OFFICIAL"),
        location: state?.location || "",
        status: "DRAFT",
        closedTime: "",
        postedTime: new Date().toISOString().slice(0, 16),
        hrId: state?.reportTo || user?.employeeId || "",
    });

    useEffect(() => {
        departmentService.getAll()
            .then((res: any) => setDepartments(res.data))
            .catch((err: any) => console.error("Could not fetch departments", err));
    }, []);

    useEffect(() => {
        if (selectedDeptId) {
            departmentService.getPositionsByDept(selectedDeptId)
                .then((res: any) => setPositions(res.data))
                .catch((err: any) => console.error("Could not fetch positions", err));
        } else {
            setPositions([]);
        }
    }, [selectedDeptId]);

    useEffect(() => {
        if (isEdit && id) {
            const fetchJob = async () => {
                try {
                    const res = await jobService.getById(id);
                    const job = res.data;

                    if (job.deptName) {
                        try {
                            const deptRes = await departmentService.getAll();
                            const matchedDept = deptRes.data.find((d: any) => d.deptName === job.deptName);
                            if (matchedDept) {
                                setSelectedDeptId(matchedDept.deptId);
                            }
                        } catch (err) {
                            console.error("Could not resolve department name to id", err);
                        }
                    }

                    setFormData({
                        requestId: job.reqId || "", // reqId map to requestId
                        posId: job.posId || "",
                        description: job.description || "",
                        responsibility: job.responsibility || "",
                        requirement: job.requirement || "",
                        benefit: job.benefit || "",
                        quantity: job.quantity || 1,
                        maxCv: job.maxCv || 0,
                        type: job.type || "OFFICIAL",
                        location: job.location || "",
                        status: job.status || "DRAFT",
                        closedTime: job.closedTime ? new Date(job.closedTime).toISOString().slice(0, 16) : "",
                        postedTime: job.postedAt ? new Date(job.postedAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
                        hrId: job.hrId || "",
                    });
                } catch (err: any) {
                    const msg = err?.response?.data?.message || "Could not fetch details.";
                    setError(msg);
                    toastError("Error", msg);
                } finally {
                    setLoading(false);
                }
            };
            fetchJob();
        }
    }, [id, isEdit, toastError]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === "quantity" || name === "maxCv") ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);

            // Format datetime properly if needed for API
            const payload = {
                ...formData,
                status: "DRAFT" as const,
                closedTime: formData.closedTime ? new Date(formData.closedTime).toISOString() : "",
                postedTime: formData.postedTime ? new Date(formData.postedTime).toISOString() : new Date().toISOString()
            };

            if (isEdit && id) {
                await jobService.update(id, payload);
                toastSuccess("Updated", "Job updated successfully.");
            } else {
                await jobService.create(payload);
                toastSuccess("Created", "Job created successfully.");
            }
            navigate("/recruitment/jobs");
        } catch (err: any) {
            toastError("Error", err?.response?.data?.message || "Failed to save job.");
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
                        {isEdit ? "Update Job" : "Post Job"}
                    </h1>
                    <p className="text-sm font-medium text-text-secondary-light mb-2">
                        <Link to="/dashboard" className="hover:text-primary transition-colors">Home</Link>
                        <span className="mx-2">&gt;</span>
                        <Link to="/recruitment/jobs" className="hover:text-primary transition-colors">Job Postings</Link>
                        <span className="mx-2">&gt;</span>
                        <span className="text-text-primary-light">{isEdit ? "Update Job" : "New Job"}</span>
                    </p>
                </div>
            </div>

            {error && <ErrorMessage message={error} />}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-2xl border border-border-light bg-white shadow-card p-6 md:p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelCls}>Department</label>
                            <select
                                required
                                value={selectedDeptId}
                                onChange={(e) => setSelectedDeptId(e.target.value)}
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
                            <label className={labelCls}>Position Title</label>
                            <select
                                required
                                name="posId"
                                value={formData.posId}
                                onChange={handleChange}
                                className={inputCls}
                                disabled={!selectedDeptId}
                            >
                                <option value="" disabled>Select a position</option>
                                {positions.map(pos => (
                                    <option key={pos.posId} value={pos.posId}>
                                        {pos.posName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelCls}>Post Time</label>
                            <input
                                type="datetime-local"
                                name="postedTime"
                                value={formData.postedTime}
                                onChange={handleChange}
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Close Time</label>
                            <input
                                type="datetime-local"
                                name="closedTime"
                                value={formData.closedTime}
                                onChange={handleChange}
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Max CV</label>
                            <input
                                required
                                type="number"
                                min="1"
                                name="maxCv"
                                value={formData.maxCv}
                                onChange={handleChange}
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Employment Type</label>
                            <select
                                required
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className={inputCls}
                            >
                                <option value="OFFICIAL">Official</option>
                                <option value="PROBATION">Probation</option>
                                <option value="INTERN">Intern</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelCls}>Location</label>
                            <input
                                required
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g. Ho Chi Minh City"
                                className={inputCls}
                            />
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



                        <div className="md:col-span-2">
                            <label className={labelCls}>Description</label>
                            <textarea
                                required
                                name="description"
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Job description..."
                                className={`${inputCls} resize-none`}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelCls}>Responsibility</label>
                            <textarea
                                required
                                name="responsibility"
                                rows={3}
                                value={formData.responsibility}
                                onChange={handleChange}
                                placeholder="Job responsibilities..."
                                className={`${inputCls} resize-none`}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelCls}>Requirement</label>
                            <textarea
                                required
                                name="requirement"
                                rows={3}
                                value={formData.requirement}
                                onChange={handleChange}
                                placeholder="Job requirements..."
                                className={`${inputCls} resize-none`}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelCls}>Benefit</label>
                            <textarea
                                required
                                name="benefit"
                                rows={3}
                                value={formData.benefit}
                                onChange={handleChange}
                                placeholder="Job benefits..."
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
                        {isEdit ? "Update Job" : "Post Job"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default JobFormPage;
