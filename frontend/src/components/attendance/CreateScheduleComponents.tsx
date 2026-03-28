import React, { useState } from "react";
import { type ShiftResponse, createShift } from "../../services/attendanceService";

// --- CreateShiftModal ---
interface CreateShiftModalProps {
    onClose: () => void;
    onCreated: (shift: ShiftResponse) => void;
}

export const CreateShiftModal: React.FC<CreateShiftModalProps> = ({ onClose, onCreated }) => {
    const [name, setName] = useState("");
    const [startTime, setStartTime] = useState("08:00");
    const [endTime, setEndTime] = useState("17:00");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        setError(null);
        if (!name.trim()) { setError("Shift name is required."); return; }
        if (!startTime) { setError("Start time is required."); return; }
        if (!endTime) { setError("End time is required."); return; }
        setSaving(true);
        try {
            const created = await createShift({ name: name.trim(), startTime, endTime });
            onCreated(created);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? err.message ?? "Failed to create shift.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🕐</span>
                        <h2 className="text-[17px] font-bold text-[#0f172a]">Create New Shift</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f1f5f9] text-[#64748b] text-lg font-bold transition-colors">×</button>
                </div>
                {error && (
                    <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                        <span className="flex-shrink-0">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-[#374151] mb-1.5">Shift Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Morning Shift..." className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all" autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-[#374151] mb-1.5">Start Time</label>
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[#374151] mb-1.5">End Time</label>
                            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all" />
                        </div>
                    </div>
                </div>
                {name && startTime && endTime && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-[#f0fdf4] border border-[#86efac] rounded-xl">
                        <span className="text-sm font-semibold text-[#15803d]">{name}</span>
                        <span className="ml-auto text-xs text-[#64748b] font-medium">{startTime} – {endTime}</span>
                    </div>
                )}
                <div className="flex gap-3 pt-1">
                    <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#64748b] font-semibold text-sm hover:bg-[#f8fafc] transition-all">Cancel</button>
                    <button type="button" onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] disabled:opacity-60 text-white font-semibold text-sm shadow-sm transition-all">
                        {saving ? (
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                        ) : "➕"}
                        {saving ? "Saving..." : "Create Shift"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Helper Functions used by components below (copied from CreateSchedule for independence) ---
function formatTime(t: string) { return t.slice(0, 5); }

// --- ShiftCard ---
export const ShiftCard: React.FC<{ shift: ShiftResponse; selected: boolean; onClick: () => void }> = ({ shift, selected, onClick }) => (
    <button type="button" onClick={onClick}
        className={`w-full text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${selected ? "border-[#0d9488] bg-[#ccfbf1]" : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"}`}>
        <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-[13px] text-[#0f172a]">{shift.name}</span>
            {selected && (
                <span className="ml-auto w-4 h-4 rounded-full bg-[#0d9488] flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </span>
            )}
        </div>
        <p className="text-[12px] text-[#64748b] font-medium">{formatTime(shift.startTime)} – {formatTime(shift.endTime)}</p>
    </button>
);

// --- ResultBanner ---
export const ResultBanner: React.FC<{ count: number; onClose: () => void }> = ({ count, onClose }) => (
    <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 mb-6">
        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-semibold">Success! Created {count} schedule(s).</span>
        <button onClick={onClose} className="ml-auto text-green-700 hover:text-green-900 font-bold text-lg leading-none">×</button>
    </div>
);
