import React, { useState, useEffect } from "react";
import { searchEmployees } from "../../services/employeeService";
import { type LeaveBalanceResponse } from "../../services/requestService";

export interface AttendanceEmployee {
    employeeId: string;
    employeeCode: string;
    fullName: string;
    position: string;
    deptName: string;
}

export const EmployeeSearch: React.FC<{
    value: AttendanceEmployee | null;
    onChange: (emp: AttendanceEmployee | null) => void;
}> = ({ value, onChange }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<AttendanceEmployee[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await searchEmployees(query);
                setResults(
                    data.map((emp) => ({
                        employeeId: emp.employeeId,
                        employeeCode: emp.employeeCode,
                        fullName: emp.fullName,
                        position: emp.position,
                        deptName: emp.deptName,
                    }))
                );
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="relative">
            <input
                type="text"
                value={value ? value.fullName : query}
                onChange={(e) => {
                    onChange(null);
                    setQuery(e.target.value);
                }}
                placeholder="Search employee name or code..."
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
            />
            {!value && results.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {loading && (
                        <li className="px-3 py-2 text-sm text-[#64748b]">Searching…</li>
                    )}
                    {results.map((emp) => (
                        <li
                            key={emp.employeeId}
                            onClick={() => {
                                onChange(emp);
                                setQuery("");
                                setResults([]);
                            }}
                            className="px-3 py-2 text-sm hover:bg-[#f8fafc] cursor-pointer"
                        >
                            <span className="font-semibold text-[#1e293b]">
                                {emp.fullName}
                            </span>
                            <span className="ml-2 text-xs text-[#94a3b8]">
                                {emp.employeeCode} · {emp.deptName}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export const LeaveModalContent: React.FC<{
    leaveBalanceLoading: boolean;
    leaveBalance: LeaveBalanceResponse | null;
    formData: any;
    setFormData: (data: any) => void;
}> = ({ leaveBalanceLoading, leaveBalance, formData, setFormData }) => (
    <>
        {leaveBalanceLoading ? (
            <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-sm text-[#64748b]">
                Loading leave balance...
            </div>
        ) : leaveBalance ? (
            <div className="p-4 bg-gradient-to-r from-[#f0fdf4] to-[#ecfdf5] border border-[#86efac] rounded-xl">
                <p className="text-xs font-bold text-[#15803d] uppercase tracking-wider mb-2">
                    Leave Balance {leaveBalance.year}
                </p>
                <div className="flex items-center gap-4">
                    <div className="flex-1 text-center">
                        <p className="text-2xl font-bold text-[#0f766e]">
                            {leaveBalance.annualLeaveTotal - leaveBalance.annualLeaveUsed}
                        </p>
                        <p className="text-[10px] text-[#64748b] font-medium">Annual Leave Left</p>
                    </div>
                    <div className="w-px h-10 bg-[#86efac]" />
                    <div className="flex-1 text-center">
                        <p className="text-2xl font-bold text-[#64748b]">
                            {leaveBalance.annualLeaveUsed}
                        </p>
                        <p className="text-[10px] text-[#64748b] font-medium">Annual Used</p>
                    </div>
                    <div className="w-px h-10 bg-[#86efac]" />
                    <div className="flex-1 text-center">
                        <p className="text-2xl font-bold text-[#64748b]">
                            {leaveBalance.sickLeaveUsed}
                        </p>
                        <p className="text-[10px] text-[#64748b] font-medium">Sick Used</p>
                    </div>
                </div>
            </div>
        ) : (
            <div className="p-3 bg-[#fef3c7] border border-[#fcd34d] rounded-lg text-sm text-[#92400e]">
                ⚠️ Could not load leave balance. You can still submit but approval may be rejected.
            </div>
        )}
        <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Leave Type</label>
            <select
                value={formData.leaveType}
                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
            >
                <option>Annual Leave</option>
                <option>Sick Leave</option>
            </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-semibold text-[#334155] mb-1.5">Start Date</label>
                <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-[#334155] mb-1.5">End Date</label>
                <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
                />
            </div>
        </div>
        <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Reason</label>
            <textarea
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Describe the reason for the leave..."
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
            />
        </div>
    </>
);

export const OTModalContent: React.FC<{ formData: any; setFormData: (data: any) => void; }> = ({ formData, setFormData }) => (
    <>
        <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">OT Date</label>
            <input
                type="date"
                value={formData.otDate}
                onChange={(e) => setFormData({ ...formData, otDate: e.target.value })}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
            />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-semibold text-[#334155] mb-1.5">Start Time</label>
                <input
                    type="time"
                    value={formData.otStartTime}
                    onChange={(e) => setFormData({ ...formData, otStartTime: e.target.value })}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-[#334155] mb-1.5">End Time</label>
                <input
                    type="time"
                    value={formData.otEndTime}
                    onChange={(e) => setFormData({ ...formData, otEndTime: e.target.value })}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
                />
            </div>
        </div>
        <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Reason for OT</label>
            <textarea
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Describe the task requiring overtime..."
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
            />
        </div>
    </>
);

export const OtherModalContent: React.FC<{ formData: any; setFormData: (data: any) => void; }> = ({ formData, setFormData }) => (
    <>
        <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Date</label>
            <input
                type="date"
                value={formData.otherDate}
                onChange={(e) => setFormData({ ...formData, otherDate: e.target.value })}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
            />
        </div>
        <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Reason</label>
            <textarea
                rows={4}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Please provide details for your request..."
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
            />
        </div>
    </>
);

export const ResignationModalContent: React.FC<{ formData: any; setFormData: (data: any) => void; }> = ({ formData, setFormData }) => (
    <>
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-red-800">
                <p className="font-semibold">Notice regarding resignation</p>
                <p className="mt-1 opacity-90">
                    Please ensure you have communicated with your direct manager before submitting this official request in the system.
                </p>
            </div>
        </div>
        <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Expected Last Day</label>
            <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
            />
        </div>
        <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Reason for Resignation</label>
            <textarea
                rows={4}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Please describe your reason..."
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
            />
        </div>
    </>
);

export const PersonnelChangeModalContent: React.FC<{
    formData: any;
    setFormData: (data: any) => void;
    pcEmployee: AttendanceEmployee | null;
    setPcEmployee: (emp: AttendanceEmployee | null) => void;
    departments: { id: string; name: string }[];
    positions: { id: string; name: string }[];
}> = ({ formData, setFormData, pcEmployee, setPcEmployee, departments, positions }) => (
    <div className="space-y-4">
        <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Employee</label>
            <EmployeeSearch value={pcEmployee} onChange={setPcEmployee} />
            {pcEmployee && (
                <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {pcEmployee.fullName.charAt(0)}
                    </div>
                    <div>
                        <p className="font-semibold text-indigo-700 text-sm">{pcEmployee.fullName}</p>
                        <p className="text-xs text-indigo-600 opacity-80">
                            {pcEmployee.employeeCode} · {pcEmployee.position} · {pcEmployee.deptName}
                        </p>
                    </div>
                </div>
            )}
        </div>
        <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Change Type</label>
            <select
                value={formData.pcType}
                onChange={(e) => setFormData({ ...formData, pcType: e.target.value })}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
            >
                <option value="DEPARTMENT_TRANSFER">Department Transfer</option>
                <option value="SALARY_CHANGE">Salary Change</option>
                <option value="DISCIPLINE">Discipline</option>
                <option value="REWARD">Reward</option>
            </select>
        </div>
        {formData.pcType === "DEPARTMENT_TRANSFER" && (
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-[#334155] mb-1.5">New Department</label>
                    <select
                        value={formData.newDepartmentId}
                        onChange={(e) => setFormData({ ...formData, newDepartmentId: e.target.value })}
                        className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
                    >
                        <option value="">Select Department...</option>
                        {departments.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-[#334155] mb-1.5">New Position</label>
                    <select
                        value={formData.newPositionId}
                        onChange={(e) => setFormData({ ...formData, newPositionId: e.target.value })}
                        className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
                    >
                        <option value="">Select Position...</option>
                        {positions.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>
        )}
        {formData.pcType === "SALARY_CHANGE" && (
            <div>
                <label className="block text-sm font-semibold text-[#334155] mb-1.5">New Base Salary</label>
                <input
                    type="number"
                    value={formData.newSalary}
                    onChange={(e) => setFormData({ ...formData, newSalary: e.target.value })}
                    placeholder="e.g. 25000000"
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
                />
            </div>
        )}
        <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Reason / Description</label>
            <textarea
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Reason for this change..."
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
            />
        </div>
    </div>
);
