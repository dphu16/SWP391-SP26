import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from "react";
import apiClient from "../../services/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExtractedContract {
  fullName?: string;
  phone?: string;
  email?: string;
  gender?: string;
  address?: string;
  citizenId?: string;
  taxCode?: string;
  dateOfBirth?: string;
  baseSalary?: number;
  contractNumber?: string;
  startDate?: string;
  endDate?: string;
  dateOfJoining?: string;
  departmentName?: string;
  positionName?: string;
}

/**
 * State machine for the offboard flow:
 *   null               → not in offboard flow
 *   "awaiting_confirm" → AI asked "Bạn có chắc muốn offboard [tên]?"
 *   "awaiting_reason"  → user confirmed, AI asked "Vui lòng cho biết lý do?"
 */
type OffboardStep = "awaiting_confirm" | "awaiting_reason" | null;

interface OffboardState {
  step: OffboardStep;
  employeeName: string;
  employeeId: string | null;
}

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
  extractedData?: ExtractedContract | null;
  fileBase64?: string | null;
};

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Shared Vietnamese diacritic normalizer used by both search and offboard intent detection. */
function normalizeVietnamese(input: string): string {
  if (!input) return "";
  const nfd = input.normalize("NFD");
  return nfd
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, (c) => (c === "đ" ? "d" : "D"))
    .toLowerCase()
    .trim();
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Offboard intent detector ─────────────────────────────────────────────────

const OFFBOARD_PATTERNS = [
  /xoa\s+nhan\s+vien\s+(.+)/i,
  /offboard\s+(.+)/i,
  /cho\s+nghi\s+viec\s+nhan\s+vien\s+(.+)/i,
  /cho\s+nghi\s+viec\s+(.+)/i,
  /nghi\s+viec\s+nhan\s+vien\s+(.+)/i,
  /remove\s+employee\s+(.+)/i,
  /terminate\s+employee\s+(.+)/i,
  /sa\s+thai\s+(.+)/i,
];

/**
 * Returns the extracted employee name if the message is an offboard intent,
 * otherwise returns null.
 */
function detectOffboardIntent(message: string): string | null {
  const normalized = normalizeVietnamese(message);
  for (const pattern of OFFBOARD_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      // Return the original casing of the name from the original input
      // by mapping the normalized match back to the original string.
      const normalizedName = match[1].trim();
      if (normalizedName.length > 0) {
        // Try to find the original name in the original message
        const originalWords = message.split(/\s+/);
        const nameWordCount = normalizedName.split(/\s+/).length;
        // Take last N words from the original message matching match length
        const originalName = originalWords.slice(-nameWordCount).join(" ");
        return originalName || match[1].trim();
      }
    }
  }
  return null;
}

// ─── SVG Icons (Lucide-style) ─────────────────────────────────────────────────

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const BotIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </svg>
);

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const PaperclipIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const UserPlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const UserXIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="18" y1="8" x2="23" y2="13" />
    <line x1="23" y1="8" x2="18" y2="13" />
  </svg>
);

// ─── Sub-components ────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex gap-1.5 items-center py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary/60"
          style={{ animation: `ai-bounce 1.1s ease infinite`, animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function PlainPDFViewer({ fileBase64 }: { fileBase64: string }) {
  const dataUri = `data:application/pdf;base64,${fileBase64}`;
  return (
    <div className="flex-1 w-full h-full overflow-hidden flex">
      <iframe src={dataUri} width="100%" height="100%" title="PDF Preview" className="border-0 block flex-1" />
    </div>
  );
}

function ExtractedDataCard({
  extractedData,
  onCreateEmployee,
  creating,
  created,
}: {
  extractedData: ExtractedContract;
  onCreateEmployee: () => void;
  creating: boolean;
  created: boolean;
}) {
  const data = extractedData;

  const displayFields = [
    { name: "fullName",       label: "Họ tên",    value: data.fullName },
    { name: "email",          label: "Email",      value: data.email },
    { name: "phone",          label: "SĐT",        value: data.phone },
    { name: "gender",         label: "Giới tính",  value: data.gender === "MALE" ? "Nam" : data.gender === "FEMALE" ? "Nữ" : data.gender },
    { name: "citizenId",      label: "CCCD",       value: data.citizenId },
    { name: "departmentName", label: "Phòng ban",  value: data.departmentName },
    { name: "positionName",   label: "Vị trí",     value: data.positionName },
    { name: "baseSalary",     label: "Lương CB",   value: data.baseSalary ? data.baseSalary.toLocaleString("vi-VN") + " VNĐ" : undefined },
    { name: "contractNumber", label: "Số HĐ",      value: data.contractNumber },
    { name: "startDate",      label: "Ngày BĐ",    value: data.startDate },
    { name: "endDate",        label: "Ngày KT",    value: data.endDate },
  ].filter((f) => f.value);

  return (
    <div className="mt-2 rounded-xl border border-border-light bg-surface-light overflow-hidden animate-fade-in shadow-card">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-light bg-[#ECFEFF]">
        <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-white flex-shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <span className="text-xs font-bold text-text-primary-light uppercase tracking-wider" style={{ fontFamily: "Archivo, sans-serif" }}>
          Thông tin trích xuất từ hợp đồng
        </span>
      </div>

      {/* Fields */}
      <div className="p-3 space-y-1.5">
        {displayFields.map((f) => (
          <div key={f.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-border-light/60">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light">
              {f.label}
            </span>
            <span className="text-xs font-semibold text-text-primary-light text-right max-w-[55%] truncate">
              {f.value || "—"}
            </span>
          </div>
        ))}
      </div>

      {/* Action */}
      <div className="px-3 pb-3">
        <button
          onClick={onCreateEmployee}
          disabled={creating || created}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
            created
              ? "bg-cta text-white"
              : creating
              ? "bg-primary/70 text-white cursor-not-allowed"
              : "bg-primary hover:bg-primary-hover text-white shadow-sm shadow-primary/20"
          }`}
        >
          {created ? (
            <><CheckIcon /> Đã tạo nhân viên thành công</>
          ) : creating ? (
            <><SpinnerIcon /> Đang tạo...</>
          ) : (
            <><UserPlusIcon /> Tạo nhân viên mới</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIChatBox() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("hrm_ai_messages");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error("Failed to parse saved chat", e); }
    }
    return [
      {
        id: uid(),
        role: "ai",
        content: "Xin chào! Tôi là trợ lý AI của HRM Pro. Tôi có thể giúp bạn trả lời câu hỏi, quét hợp đồng để tạo nhân viên mới, hoặc xử lý yêu cầu offboard. Hãy bắt đầu nào!",
      },
    ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creatingMap, setCreatingMap] = useState<Record<string, boolean>>({});
  const [createdMap, setCreatedMap] = useState<Record<string, boolean>>({});

  const [activeExtractedData, setActiveExtractedData] = useState<ExtractedContract | null>(() => {
    const saved = localStorage.getItem("hrm_ai_activeExtractedData");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });
  const [activeFileBase64, setActiveFileBase64] = useState<string | null>(() => {
    return localStorage.getItem("hrm_ai_activeFileBase64");
  });

  // ── Offboard flow state ──
  const [offboardState, setOffboardState] = useState<OffboardState>({
    step: null,
    employeeName: "",
    employeeId: null,
  });

  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [positions, setPositions] = useState<{ id: string; title: string }[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem("hrm_ai_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (activeExtractedData) {
      localStorage.setItem("hrm_ai_activeExtractedData", JSON.stringify(activeExtractedData));
    } else {
      localStorage.removeItem("hrm_ai_activeExtractedData");
    }
  }, [activeExtractedData]);

  useEffect(() => {
    if (activeFileBase64) {
      localStorage.setItem("hrm_ai_activeFileBase64", activeFileBase64);
    } else {
      localStorage.removeItem("hrm_ai_activeFileBase64");
    }
  }, [activeFileBase64]);

  // Fetch lookup options on mount
  useEffect(() => {
    async function fetchOptions() {
      try {
        const [deptRes, posRes] = await Promise.all([
          apiClient.get("/api/lookup/departments"),
          apiClient.get("/api/lookup/positions"),
        ]);
        setDepartments(deptRes.data);
        setPositions(posRes.data);
      } catch (err) {
        console.error("Failed to fetch lookup options:", err);
      }
    }
    fetchOptions();
  }, []);

  // ── Offboard: look up employee by name and return their ID ──
  async function findEmployeeIdByName(name: string): Promise<{ id: string; fullName: string } | null> {
    try {
      const { data } = await apiClient.get("/api/employees/search", {
        params: { fullName: name, size: 5 },
      });
      const content: Array<{ id: string; fullName: string }> = data.content ?? [];
      if (content.length === 0) return null;

      // Try exact match first (normalized), then fall back to first result
      const normalizedTarget = normalizeVietnamese(name);
      const exact = content.find(
        (e) => normalizeVietnamese(e.fullName) === normalizedTarget
      );
      return exact ?? content[0];
    } catch {
      return null;
    }
  }

  // ── Offboard: call the propose offboarding endpoint ──
  async function proposeOffboarding(employeeId: string, reason: string): Promise<void> {
    // Use "MANAGER_PROPOSED" as the offboarding type for AI-initiated offboards
    await apiClient.post(`/api/offboarding/propose/${employeeId}`, {
      type: "MANAGER_PROPOSED",
      reason,
    });
  }

  // ── Handle the multi-step offboard conversation ──
  async function handleOffboardFlow(userMsg: string): Promise<boolean> {
    const { step, employeeName, employeeId } = offboardState;

    // Step 1 — we just asked "bạn có chắc không?", now reading the confirmation
    if (step === "awaiting_confirm") {
      const norm = normalizeVietnamese(userMsg);
      const confirmed =
        norm === "co" ||
        norm === "chac" ||
        norm === "dong y" ||
        norm === "xac nhan" ||
        norm === "yes" ||
        norm === "ok" ||
        norm === "dung" ||
        norm.includes("co chac") ||
        norm.includes("xac nhan");

      if (!confirmed) {
        // User cancelled
        setOffboardState({ step: null, employeeName: "", employeeId: null });
        addAiMessage("Đã hủy yêu cầu offboard. Có điều gì khác tôi có thể giúp bạn không?");
        return true;
      }

      // Confirmed — ask for reason
      setOffboardState((prev) => ({ ...prev, step: "awaiting_reason" }));
      addAiMessage(`Vui lòng cho biết lý do nghỉ việc của nhân viên **${employeeName}**?`);
      return true;
    }

    // Step 2 — we have the reason, now call the API
    if (step === "awaiting_reason") {
      const reason = userMsg.trim();
      if (reason.length < 3) {
        addAiMessage("Lý do quá ngắn. Vui lòng cung cấp lý do cụ thể hơn để tiến hành offboard.");
        return true;
      }

      setLoading(true);
      try {
        let resolvedEmployeeId = employeeId;

        // If we don't have the ID yet, search for the employee
        if (!resolvedEmployeeId) {
          const found = await findEmployeeIdByName(employeeName);
          if (!found) {
            setOffboardState({ step: null, employeeName: "", employeeId: null });
            addAiMessage(`Không tìm thấy nhân viên **${employeeName}** trong hệ thống. Vui lòng kiểm tra lại tên.`);
            setLoading(false);
            return true;
          }
          resolvedEmployeeId = found.id;
        }

        await proposeOffboarding(resolvedEmployeeId, reason);
        setOffboardState({ step: null, employeeName: "", employeeId: null });
        addAiMessage(
          `Đã tạo yêu cầu offboard cho nhân viên **${employeeName}** thành công!\n\n` +
          `Lý do: ${reason}\n\n` +
          `Yêu cầu đã được gửi và đang chờ Manager xem xét.`
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        addAiMessage(`Lỗi khi tạo yêu cầu offboard: ${errMsg}`);
        setOffboardState({ step: null, employeeName: "", employeeId: null });
      } finally {
        setLoading(false);
      }
      return true;
    }

    // Not in any offboard step — check if this message IS a new offboard intent
    const detectedName = detectOffboardIntent(userMsg);
    if (detectedName) {
      setLoading(true);
      try {
        // Pre-fetch employee to give better confirmation message
        const found = await findEmployeeIdByName(detectedName);
        if (!found) {
          addAiMessage(`Không tìm thấy nhân viên **"${detectedName}"** trong hệ thống. Vui lòng kiểm tra lại tên.`);
          setLoading(false);
          return true;
        }

        setOffboardState({
          step: "awaiting_confirm",
          employeeName: found.fullName,
          employeeId: found.id,
        });
        addAiMessage(
          `Bạn có chắc muốn offboard nhân viên **${found.fullName}** không?\n\nHành động này sẽ tạo yêu cầu nghỉ việc và không thể hoàn tác dễ dàng.\n\nNhập **"Có"** để xác nhận hoặc **"Không"** để hủy.`
        );
      } catch {
        addAiMessage("Không thể kiểm tra thông tin nhân viên. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
      return true;
    }

    return false; // Not an offboard message
  }

  function addAiMessage(content: string) {
    setMessages((prev) => [...prev, { id: uid(), role: "ai", content }]);
  }

  // ── Chat send ──
  async function sendChat() {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMsg: ChatMessage = { id: uid(), role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);

    // If we are inside the offboard flow, handle it first
    const wasOffboard = await handleOffboardFlow(msg);
    if (wasOffboard) return;

    // Normal chat flow
    setLoading(true);
    try {
      if (activeExtractedData) {
        const { data } = await apiClient.post("/api/ai/edit-chat", {
           message: msg,
           currentData: activeExtractedData
        });
        setActiveExtractedData(data.updatedData);
        const aiMsg: ChatMessage = {
          id: uid(), role: "ai", content: data.confirmMessage,
          extractedData: data.updatedData, fileBase64: activeFileBase64
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const { data } = await apiClient.post("/api/ai/chat", { message: msg });
        setMessages((prev) => [...prev, { id: uid(), role: "ai", content: data.answer }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: uid(), role: "ai",
        content: `Lỗi kết nối: ${err instanceof Error ? err.message : "Unknown error"}`,
      }]);
    } finally {
      setLoading(false);
    }
  }

  // ── File upload ──
  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const fileMsg: ChatMessage = { id: uid(), role: "user", content: `Đã đính kèm: ${file.name}` };
    setMessages((prev) => [...prev, fileMsg]);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        setActiveFileBase64(base64Data);
        try {
          const { data } = await apiClient.post("/api/ai/scan-contract", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          setActiveExtractedData(data);
          const aiMsg: ChatMessage = {
            id: uid(), role: "ai",
            content: "Tôi đã quét xong hợp đồng. Dưới đây là thông tin trích xuất được:",
            extractedData: data, fileBase64: base64Data
          };
          setMessages((prev) => [...prev, aiMsg]);
        } catch (err) {
          setMessages((prev) => [...prev, {
            id: uid(), role: "ai",
            content: `Lỗi khi quét file: ${err instanceof Error ? err.message : "Không thể xử lý file"}`,
          }]);
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  }

  // ── Create employee from contract ──
  async function handleCreateEmployee(msgId: string, data: ExtractedContract) {
    setCreatingMap((prev) => ({ ...prev, [msgId]: true }));
    try {
      const matchedDept = departments.find(d =>
        data.departmentName && d.name.toLowerCase().includes(data.departmentName.toLowerCase())
      ) || departments[0];
      const matchedPos = positions.find(p =>
        data.positionName && p.title.toLowerCase().includes(data.positionName.toLowerCase())
      ) || positions[0];

      if (!matchedDept || !matchedPos) {
        throw new Error("Không tìm thấy thông tin Phòng ban hoặc Vị trí hợp lệ. Vui lòng kiểm tra lại hệ thống.");
      }

      const payload = {
        fullName: data.fullName || "", phone: data.phone || "", email: data.email || "",
        gender: data.gender === "FEMALE" ? "FEMALE" : data.gender === "OTHER" ? "OTHER" : "MALE",
        address: data.address || "", citizenId: data.citizenId || "", taxCode: data.taxCode || "",
        dateOfBirth: data.dateOfBirth || null, baseSalary: data.baseSalary || 0,
        contractNumber: data.contractNumber || "",
        startDate: data.startDate || null, endDate: data.endDate || null,
        dateOfJoining: data.dateOfJoining || data.startDate || null,
        role: "ROLE_EMPLOYEE", status: "PROBATION",
        departmentId: matchedDept.id, positionId: matchedPos.id,
      };

      await apiClient.post("/api/ai/onboarding/create-and-submit", payload);
      setCreatedMap((prev) => ({ ...prev, [msgId]: true }));
      setMessages((prev) => [...prev, {
        id: uid(), role: "ai",
        content: `Đã tạo nhân viên "${data.fullName}" thành công cho phòng ${matchedDept.name} và gửi yêu cầu phê duyệt!`,
      }]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => [...prev, {
        id: uid(), role: "ai",
        content: `Lỗi khi tạo nhân viên: ${errorMsg}`,
      }]);
    } finally {
      setCreatingMap((prev) => ({ ...prev, [msgId]: false }));
    }
  }

  // ── Clear chat history ──
  function clearHistory() {
    const initial: ChatMessage[] = [{
      id: uid(), role: "ai",
      content: "Xin chào! Tôi là trợ lý AI của HRM Pro. Tôi có thể giúp bạn trả lời câu hỏi, quét hợp đồng để tạo nhân viên mới, hoặc xử lý yêu cầu offboard. Hãy bắt đầu nào!",
    }];
    setMessages(initial);
    setActiveExtractedData(null);
    setActiveFileBase64(null);
    setOffboardState({ step: null, employeeName: "", employeeId: null });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }

  const isInputActive = !!input.trim() && !loading;

  // Determine placeholder hint based on offboard state
  const inputPlaceholder =
    offboardState.step === "awaiting_confirm"
      ? "Nhập \"Có\" để xác nhận hoặc \"Không\" để hủy…"
      : offboardState.step === "awaiting_reason"
      ? "Nhập lý do nghỉ việc…"
      : "Nhập câu hỏi… (Enter để gửi)";

  return (
    <>
      <style>{`
        @keyframes ai-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ai-msg-anim { animation: none !important; }
        }
        .ai-messages-pane::-webkit-scrollbar { width: 4px; }
        .ai-messages-pane::-webkit-scrollbar-track { background: transparent; }
        .ai-messages-pane::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 2px; }
        .ai-messages-pane::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
        .ai-textarea::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="flex flex-col h-full w-full bg-surface-light" style={{ fontFamily: "Space Grotesk, sans-serif" }}>

        {/* ── Header Bar ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-light bg-surface-light flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/30">
              <BotIcon />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary-light leading-none" style={{ fontFamily: "Archivo, sans-serif" }}>
                HRM AI Assistant
              </p>
              <p className="text-[11px] text-text-secondary-light mt-0.5 leading-none">
                {offboardState.step === "awaiting_confirm"
                  ? `Đang xác nhận offboard: ${offboardState.employeeName}`
                  : offboardState.step === "awaiting_reason"
                  ? "Đang chờ lý do nghỉ việc…"
                  : activeFileBase64
                  ? "Đang phân tích hợp đồng..."
                  : "Sẵn sàng hỗ trợ"}
              </p>
            </div>
          </div>
          <button
            onClick={clearHistory}
            title="Xóa lịch sử trò chuyện"
            className="p-2 rounded-lg text-text-secondary-light hover:text-rose-600 hover:bg-rose-50 transition-colors duration-200 cursor-pointer"
          >
            <TrashIcon />
          </button>
        </div>

        {/* ── Offboard flow indicator banner ── */}
        {offboardState.step && (
          <div className="flex items-center gap-2 px-5 py-2 bg-amber-50 border-b border-amber-200 flex-shrink-0">
            <UserXIcon />
            <span className="text-xs font-medium text-amber-700">
              {offboardState.step === "awaiting_confirm"
                ? `Đang trong luồng offboard — nhân viên: ${offboardState.employeeName}`
                : `Đang chờ lý do để hoàn tất offboard — ${offboardState.employeeName}`}
            </span>
            <button
              onClick={() => {
                setOffboardState({ step: null, employeeName: "", employeeId: null });
                addAiMessage("Đã hủy yêu cầu offboard.");
              }}
              className="ml-auto text-[11px] font-semibold text-amber-600 hover:text-amber-800 transition-colors cursor-pointer"
            >
              Hủy
            </button>
          </div>
        )}

        {/* ── Main Content ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Chat Pane */}
          <div className={`flex flex-col overflow-hidden transition-all duration-300 ${activeFileBase64 ? "w-1/2 border-r border-border-light" : "w-full"}`}>

            {/* Messages */}
            <div className="ai-messages-pane flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`ai-msg-anim flex gap-2.5 animate-fade-in ${msg.role === "user" ? "flex-row-reverse self-end" : "flex-row self-start"} ${msg.extractedData ? "w-full max-w-[96%]" : "max-w-[82%]"}`}
                >
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    msg.role === "ai"
                      ? "bg-primary text-white"
                      : "bg-[#ECFEFF] border border-border-light text-primary"
                  }`}>
                    {msg.role === "ai" ? <BotIcon /> : <UserIcon />}
                  </div>

                  {/* Bubble */}
                  <div className="flex-1 min-w-0">
                    <div className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      msg.role === "ai"
                        ? "bg-surface-light border border-border-light text-text-primary-light rounded-tr-2xl rounded-br-2xl rounded-bl-2xl shadow-sm"
                        : "bg-primary text-white rounded-tl-2xl rounded-br-2xl rounded-bl-2xl shadow-sm shadow-primary/20"
                    }`}>
                      {msg.content}
                    </div>

                    {msg.extractedData && (
                      <ExtractedDataCard
                        extractedData={msg.extractedData}
                        onCreateEmployee={() => handleCreateEmployee(msg.id, msg.extractedData!)}
                        creating={!!creatingMap[msg.id]}
                        created={!!createdMap[msg.id]}
                      />
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {(loading || uploading) && (
                <div className="ai-msg-anim flex gap-2.5 self-start animate-fade-in">
                  <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BotIcon />
                  </div>
                  <div className="bg-surface-light border border-border-light rounded-tr-2xl rounded-br-2xl rounded-bl-2xl px-4 py-3 shadow-sm">
                    {uploading ? (
                      <span className="text-xs text-primary font-medium flex items-center gap-2">
                        <SpinnerIcon /> Đang quét hợp đồng...
                      </span>
                    ) : (
                      <TypingDots />
                    )}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex items-end gap-2 px-4 py-3 border-t border-border-light bg-surface-light flex-shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || loading || !!offboardState.step}
                title="Đính kèm file hợp đồng"
                className={`w-9 h-9 rounded-xl border border-border-light flex items-center justify-center flex-shrink-0 transition-all duration-200 cursor-pointer ${
                  uploading || loading || offboardState.step
                    ? "text-text-muted-light cursor-not-allowed bg-gray-50"
                    : "text-text-secondary-light hover:text-primary hover:border-primary hover:bg-[#ECFEFF]"
                }`}
              >
                <PaperclipIcon />
              </button>

              <textarea
                ref={textareaRef}
                className="ai-textarea flex-1 resize-none border border-border-light rounded-xl px-3.5 py-2.5 text-sm text-text-primary-light bg-gray-50 outline-none leading-relaxed max-h-28 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-surface-light placeholder:text-text-muted-light"
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={inputPlaceholder}
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              />

              <button
                onClick={() => sendChat()}
                disabled={!isInputActive}
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 cursor-pointer ${
                  isInputActive
                    ? "bg-primary hover:bg-primary-hover text-white shadow-sm shadow-primary/25"
                    : "bg-gray-100 text-text-muted-light cursor-not-allowed"
                }`}
              >
                <SendIcon />
              </button>
            </div>
          </div>

          {/* PDF Artifact Pane */}
          {activeFileBase64 && (
            <div className="flex flex-col w-1/2 bg-gray-50 overflow-hidden animate-fade-in">
              {/* PDF Pane Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-light bg-surface-light flex-shrink-0">
                <p className="text-xs font-semibold text-text-secondary-light uppercase tracking-wider">
                  Xem trước hợp đồng
                </p>
                <button
                  onClick={() => setActiveFileBase64(null)}
                  className="text-[11px] font-medium text-text-secondary-light hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
              <PlainPDFViewer fileBase64={activeFileBase64} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
