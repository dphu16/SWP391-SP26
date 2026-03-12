import React, { useState, useEffect } from "react";
import {
    getMyHistory,
    updateAttendanceLog,
    type AttendanceLogResponse
} from "../../services/attendanceService";

interface EmployeeLogsModalProps {
    employeeId: string;
    employeeName: string;
    month: number;
    year: number;
    onClose: () => void;
    onUpdated: () => void; // Trigger refresh of summary
}

// Map backend status → display config
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    VALID: { label: "ON TIME", color: "#15803d", bg: "#dcfce7" },
    LATE: { label: "LATE", color: "#dc2626", bg: "#fef2f2" },
    EARLY_LEAVE: { label: "EARLY LEAVE", color: "#b45309", bg: "#fef3c7" },
    MISSING_PUNCH: { label: "AWAITING CHECK-OUT", color: "#0369a1", bg: "#e0f2fe" },
};

const EmployeeLogsModal: React.FC<EmployeeLogsModalProps> = ({
    employeeId,
    employeeName,
    month,
    year,
    onClose,
    onUpdated
}) => {
    const [logs, setLogs] = useState<AttendanceLogResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingLogId, setEditingLogId] = useState<string | null>(null);
    const [editStatus, setEditStatus] = useState<string>("");
    const [editOtHours, setEditOtHours] = useState<string>("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                // get ALL history and filter locally
                const allLogs = await getMyHistory(employeeId);
                const filtered = allLogs.filter((log) => {
                    const d = new Date(log.date);
                    return d.getMonth() + 1 === month && d.getFullYear() === year;
                });
                setLogs(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            } catch (err) {
                console.error("Failed to load history", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [employeeId, month, year]);

    const handleEditStart = (log: AttendanceLogResponse) => {
        setEditingLogId(log.logId);
        setEditStatus(log.status);
        setEditOtHours(log.otHours ? log.otHours.toString() : "0");
    };

    const handleSave = async (logId: string) => {
        setSaving(true);
        try {
            await updateAttendanceLog(logId, {
                status: editStatus,
                otHours: parseFloat(editOtHours) || 0
            });
            // Update local state
            setLogs((prev) =>
                prev.map((log) =>
                    log.logId === logId ? { ...log, status: editStatus, otHours: parseFloat(editOtHours) || 0 } : log
                )
            );
            setEditingLogId(null);
            onUpdated(); // triggers parent refresh
        } catch (err) {
            console.error(err);
            alert("Failed to update log.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-5 border-b border-[#f1f5f9] flex items-center justify-between bg-[#f8fafc]">
                    <div>
                        <h2 className="text-xl font-bold text-[#0f172a]">Edit Attendance Logs</h2>
                        <p className="text-sm text-[#64748b]">
                            {employeeName} • {month}/{year}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#94a3b8] hover:text-[#0f172a] transition-colors p-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-5 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="py-20 flex flex-col justify-center items-center">
                            <div className="w-8 h-8 border-4 border-[#e2e8f0] border-t-[#0d9488] rounded-full animate-spin mb-4"></div>
                            <p className="text-[#64748b]">Loading history...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="py-20 text-center text-[#94a3b8]">
                            No logs found for this month.
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[#e2e8f0] text-[#64748b]">
                                    <th className="pb-3 font-semibold">Date</th>
                                    <th className="pb-3 font-semibold">Check-in</th>
                                    <th className="pb-3 font-semibold">Check-out</th>
                                    <th className="pb-3 font-semibold">Hours</th>
                                    <th className="pb-3 font-semibold w-24">OT Hours</th>
                                    <th className="pb-3 font-semibold w-32">Status</th>
                                    <th className="pb-3 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => {
                                    const isEditing = editingLogId === log.logId;
                                    const badge = STATUS_CONFIG[log.status] || {
                                        label: log.status,
                                        color: "#475569",
                                        bg: "#f1f5f9"
                                    };

                                    return (
                                        <tr key={log.logId} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                                            <td className="py-3 font-medium text-[#0f172a]">
                                                {log.date}
                                            </td>
                                            <td className="py-3 text-[#64748b]">{log.checkIn ? log.checkIn.substring(0, 5) : "—"}</td>
                                            <td className="py-3 text-[#64748b]">{log.checkOut ? log.checkOut.substring(0, 5) : "—"}</td>
                                            <td className="py-3 text-[#64748b]">{log.workingHours.toFixed(2)}h</td>

                                            {/* OT Hours */}
                                            <td className="py-3">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        value={editOtHours}
                                                        onChange={(e) => setEditOtHours(e.target.value)}
                                                        className="w-16 px-2 py-1 border border-[#e2e8f0] rounded text-sm focus:outline-none focus:border-[#10b981]"
                                                        step="0.5"
                                                        min="0"
                                                    />
                                                ) : (
                                                    <span className="text-[#64748b]">{log.otHours ? log.otHours.toFixed(2) + "h" : "—"}</span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="py-3">
                                                {isEditing ? (
                                                    <select
                                                        value={editStatus}
                                                        onChange={(e) => setEditStatus(e.target.value)}
                                                        className="w-full px-2 py-1 border border-[#e2e8f0] rounded text-sm focus:outline-none focus:border-[#10b981]"
                                                    >
                                                        <option value="VALID">VALID</option>
                                                        <option value="LATE">LATE</option>
                                                        <option value="EARLY_LEAVE">EARLY LEAVE</option>
                                                        <option value="MISSING_PUNCH">MISSING PUNCH</option>
                                                    </select>
                                                ) : (
                                                    <span
                                                        className="text-[10px] font-bold px-2 py-1 rounded-md"
                                                        style={{ color: badge.color, backgroundColor: badge.bg }}
                                                    >
                                                        {badge.label}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3 text-right">
                                                {isEditing ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setEditingLogId(null)}
                                                            className="text-xs text-[#64748b] hover:text-[#0f172a]"
                                                            disabled={saving}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleSave(log.logId)}
                                                            className="text-xs font-bold text-white bg-[#10b981] px-3 py-1 rounded hover:bg-[#059669]"
                                                            disabled={saving}
                                                        >
                                                            {saving ? "..." : "Save"}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEditStart(log)}
                                                        className="text-xs font-medium text-[#3b82f6] hover:text-[#2563eb]"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeLogsModal;
