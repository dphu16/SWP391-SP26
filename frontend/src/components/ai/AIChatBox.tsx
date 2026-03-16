import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from "react";
import apiClient from "../../services/apiClient";

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
  contractType?: string;
  startDate?: string;
  endDate?: string;
  dateOfJoining?: string;
  departmentName?: string;
  positionName?: string;
}

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
  extractedData?: ExtractedContract | null;
  fileBase64?: string | null;
};



// ─── SVG Icons (Lucide-style) ─────────────────────────────────────────────────

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const BotIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "hrm-spin 1s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#10B981",
            opacity: 0.4,
            animation: `hrm-bounce 1.1s ease infinite`,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}





function PlainPDFViewer({ fileBase64 }: { fileBase64: string }) {
  const dataUri = `data:application/pdf;base64,${fileBase64}`;
  
  return (
    <div style={{ flex: 1, width: "100%", height: "100%", overflow: "hidden", borderRadius: 0, display: "flex" }}>
      <iframe
        src={dataUri}
        width="100%"
        height="100%"
        title="PDF Preview"
        style={{ border: "none", display: "block", flex: 1 }}
      />
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
    { name: "fullName", label: "Họ tên", value: data.fullName },
    { name: "email", label: "Email", value: data.email },
    { name: "phone", label: "SĐT", value: data.phone },
    { name: "gender", label: "Giới", value: data.gender === "MALE" ? "Nam" : data.gender === "FEMALE" ? "Nữ" : data.gender },
    { name: "citizenId", label: "CCCD", value: data.citizenId },
    { name: "departmentName", label: "Phòng ban", value: data.departmentName },
    { name: "positionName", label: "Vị trí", value: data.positionName },
    { name: "baseSalary", label: "Lương CB", value: data.baseSalary ? data.baseSalary.toLocaleString("vi-VN") + " VNĐ" : undefined },
    { name: "contractNumber", label: "Số HĐ", value: data.contractNumber },
    { name: "contractType", label: "Loại HĐ", value: data.contractType },
    { name: "startDate", label: "Ngày BĐ", value: data.startDate },
    { name: "endDate", label: "Ngày KT", value: data.endDate },
  ].filter((f) => f.value);

  return (
    <div
      className="hrm-card-anim"
      style={{
        marginTop: 8,
        border: "1px solid #E2E8F0",
        borderRadius: 10,
        overflow: "hidden",
        background: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 100%)",
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: "#10B981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
          </div>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: "#064E3B",
              fontFamily: "Archivo, sans-serif",
            }}
          >
            Thông tin hợp đồng
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", padding: "10px 14px 12px" }}>
        {/* Fields Grid */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr", gap: "6px", width: "100%" }}>
          {displayFields.map((f) => (
            <div 
              key={f.name} 
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderRadius: 6, background: "#F8FAFC", border: "1px solid #F1F5F9" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  {f.label}
                </span>
              </div>
              <span style={{ fontSize: 12, color: "#0F172A", fontWeight: 600 }}>{f.value || "—"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "8px 14px 12px", borderTop: "1px solid #F1F5F9" }}>
        <button
          onClick={onCreateEmployee}
          disabled={creating || created}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            padding: "8px 0",
            borderRadius: 8,
            border: "none",
            fontSize: 12.5,
            fontWeight: 600,
            fontFamily: "Space Grotesk, sans-serif",
            cursor: creating || created ? "default" : "pointer",
            transition: "all 200ms ease",
            background: created ? "#22C55E" : "#10B981",
            color: "white",
            opacity: creating ? 0.7 : 1,
          }}
        >
          {created ? (
            <>
              <CheckIcon /> Đã tạo NV thành công
            </>
          ) : creating ? (
            <>
              <SpinnerIcon /> Đang tạo...
            </>
          ) : (
            <>
              <UserPlusIcon /> Tạo nhân viên mới
            </>
          )}
        </button>
      </div>
    </div>
  );
}


// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIChatBox() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: "ai",
      content: "Xin chào! Tôi là trợ lý AI. Tôi có thể giúp bạn trả lời câu hỏi hoặc quét hợp đồng để tạo nhân viên mới. Hãy bắt đầu nào!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creatingMap, setCreatingMap] = useState<Record<string, boolean>>({});
  const [createdMap, setCreatedMap] = useState<Record<string, boolean>>({});
  
  const [activeExtractedData, setActiveExtractedData] = useState<ExtractedContract | null>(null);
  const [activeFileBase64, setActiveFileBase64] = useState<string | null>(null);

  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [positions, setPositions] = useState<{ id: string; title: string }[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Fetch options on mount
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
    setLoading(true);

    try {
      if (activeExtractedData) {
        const { data } = await apiClient.post("/api/ai/edit-chat", {
           message: msg,
           currentData: activeExtractedData
        });
        
        setActiveExtractedData(data.updatedData);

        const aiMsg: ChatMessage = {
          id: uid(),
          role: "ai",
          content: data.confirmMessage,
          extractedData: data.updatedData,
          fileBase64: activeFileBase64
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const { data } = await apiClient.post("/api/ai/chat", { message: msg });
        setMessages((prev) => [...prev, { id: uid(), role: "ai", content: data.answer }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: uid(),
        role: "ai",
        content: `Lỗi kết nối: ${err instanceof Error ? err.message : "Unknown error"}`,
      }]);
    } finally {
      setLoading(false);
    }
  }

  // ── File upload (scan contract) ──
  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so user can upload same file again
    e.target.value = "";

    const fileMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: `📎 ${file.name}`,
    };
    setMessages((prev) => [...prev, fileMsg]);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Save file base64 first to be sent locally
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
            id: uid(),
            role: "ai",
            content: "Tôi đã quét xong hợp đồng. Dưới đây là thông tin trích xuất được:",
            extractedData: data,
            fileBase64: base64Data
          };
          setMessages((prev) => [...prev, aiMsg]);
        } catch (err) {
          setMessages((prev) => [...prev, {
            id: uid(),
            role: "ai",
            content: `Lỗi khi quét file: ${err instanceof Error ? err.message : "Không thể xử lý file"}`,
          }]);
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploading(false);
    }
  }

  // ── Create employee from extracted data ──
  async function handleCreateEmployee(msgId: string, data: ExtractedContract) {
    setCreatingMap((prev) => ({ ...prev, [msgId]: true }));
    try {
      // Find matching IDs for department and position
      const matchedDept = departments.find(d => 
        data.departmentName && d.name.toLowerCase().includes(data.departmentName.toLowerCase())
      ) || departments[0]; // Fallback to first if not found

      const matchedPos = positions.find(p => 
        data.positionName && p.title.toLowerCase().includes(data.positionName.toLowerCase())
      ) || positions[0]; // Fallback to first if not found

      if (!matchedDept || !matchedPos) {
        throw new Error("Không tìm thấy thông tin Phòng ban hoặc Vị trí hợp lệ. Vui lòng kiểm tra lại hệ thống.");
      }

      const payload = {
        fullName: data.fullName || "",
        phone: data.phone || "",
        email: data.email || "",
        gender: data.gender === "FEMALE" ? "FEMALE" : data.gender === "OTHER" ? "OTHER" : "MALE",
        address: data.address || "",
        citizenId: data.citizenId || "",
        taxCode: data.taxCode || "",
        dateOfBirth: data.dateOfBirth || null,
        baseSalary: data.baseSalary || 0,
        contractNumber: data.contractNumber || "",
        contractType: data.contractType || "",
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        dateOfJoining: data.dateOfJoining || data.startDate || null,
        role: "ROLE_EMPLOYEE",
        status: "PROBATION",
        departmentId: matchedDept.id,
        positionId: matchedPos.id,
        fileBase64: activeFileBase64 || ""
      };

      await apiClient.post("/api/ai/onboarding/create-and-submit", payload);
      setCreatedMap((prev) => ({ ...prev, [msgId]: true }));

      setMessages((prev) => [...prev, {
        id: uid(),
        role: "ai",
        content: `Đã tạo nhân viên "${data.fullName}" thành công cho phòng ${matchedDept.name} và gửi yêu cầu phê duyệt! Bạn có thể hỏi tôi thông tin chi tiết về hợp đồng vừa tạo.`,
      }]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => [...prev, {
        id: uid(),
        role: "ai",
        content: `Lỗi khi tạo nhân viên: ${errorMsg}`,
      }]);
    } finally {
      setCreatingMap((prev) => ({ ...prev, [msgId]: false }));
    }
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

  const isInputActive = input.trim() && !loading;

  return (
    <>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap");

        @keyframes hrm-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes hrm-msg-arrival {
          0% { opacity: 0; transform: translateY(12px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes hrm-card-slide {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes hrm-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes hrm-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .hrm-chatbox * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        .hrm-msg-anim { 
          animation: hrm-msg-arrival 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform, opacity;
        }
        .hrm-card-anim {
          opacity: 0;
          animation: hrm-card-slide 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
          will-change: transform, opacity;
        }

        .hrm-messages { scroll-behavior: smooth; }
        .hrm-messages::-webkit-scrollbar { width: 4px; }
        .hrm-messages::-webkit-scrollbar-track { background: transparent; }
        .hrm-messages::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 2px; }
        .hrm-messages::-webkit-scrollbar-thumb:hover { background: #94A3B8; }

        .hrm-textarea::-webkit-scrollbar { display: none; }

        .hrm-icon-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: color 200ms ease, opacity 200ms ease;
        }
        .hrm-icon-btn:focus-visible {
          outline: 2px solid #10B981;
          outline-offset: 2px;
        }

        @media (prefers-reduced-motion: reduce) {
          .hrm-msg-anim { animation: none; }
          .hrm-bounce { animation: none; }
          .hrm-spin { animation: none; }
        }
      `}</style>

      <div
        className="hrm-chatbox"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%", 
          width: "100%",
          maxWidth: "100%",
          background: "#FFFFFF",
          borderRadius: 0,
          fontFamily: "Space Grotesk, sans-serif",
          overflow: "hidden",
          boxShadow: "none",
        }}
      >


        {/* ── Messages ── */}
        {/* ── Main Content Area ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left Side: Chat */}
          <div style={{ 
            flex: activeFileBase64 ? "0 0 50%" : "1 1 100%", 
            display: "flex", 
            flexDirection: "column", 
            borderRight: activeFileBase64 ? "1px solid #E2E8F0" : "none",
            transition: "flex 300ms cubic-bezier(0.16, 1, 0.3, 1)",
            overflow: "hidden"
          }}>
            <div
              className="hrm-messages hrm-messages-scroll"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                background: "#FAFBFC",
              }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="hrm-msg-anim"
                  style={{
                    display: "flex",
                    gap: 10,
                    flexDirection: msg.role === "user" ? "row-reverse" : "row",
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: (msg.extractedData) ? "98%" : "85%",
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: msg.role === "ai" ? "#10B981" : "#D1FAE5",
                      border: msg.role === "user" ? "1px solid #E2E8F0" : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                      color: msg.role === "ai" ? "white" : "#10B981",
                    }}
                  >
                    {msg.role === "ai" ? <BotIcon /> : <UserIcon />}
                  </div>

                  {/* Bubble */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius:
                          msg.role === "ai" ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
                        background: msg.role === "ai" ? "#FFFFFF" : "#10B981",
                        color: msg.role === "ai" ? "#064E3B" : "white",
                        fontSize: 13.5,
                        lineHeight: 1.7,
                        border: msg.role === "ai" ? "1px solid #E2E8F0" : "none",
                        boxShadow:
                          msg.role === "ai"
                            ? "0 1px 2px rgba(0,0,0,0.04)"
                            : "0 1px 3px rgba(16, 185, 129, 0.2)",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {msg.content}
                    </div>

                    {/* Extracted contract data card */}
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

              {/* Typing / uploading indicator */}
              {(loading || uploading) && (
                <div
                  className="hrm-msg-anim"
                  style={{ display: "flex", gap: 10, alignSelf: "flex-start" }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: "#10B981",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    <BotIcon />
                  </div>
                  <div
                    style={{
                      padding: "12px 16px",
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "4px 12px 12px 12px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {uploading ? (
                      <span style={{ fontSize: 12.5, color: "#10B981", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
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

            {/* ── Input Area ── */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                padding: "12px 18px",
                borderTop: "1px solid #E2E8F0",
                background: "#FFFFFF",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />

              <button
                className="hrm-icon-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || loading}
                title="Tải lên hợp đồng"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  color: uploading || loading ? "#CBD5E1" : "#64748B",
                  cursor: uploading || loading ? "not-allowed" : "pointer",
                  flexShrink: 0,
                  background: "transparent",
                  border: "1.5px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 200ms ease",
                }}
              >
                <PaperclipIcon />
              </button>

              <textarea
                ref={textareaRef}
                className="hrm-textarea"
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi..."
                style={{
                  flex: 1,
                  resize: "none",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 10,
                  padding: "9px 14px",
                  fontSize: 13.5,
                  fontFamily: "Space Grotesk, sans-serif",
                  color: "#064E3B",
                  background: "#F8FAFC",
                  outline: "none",
                  lineHeight: 1.55,
                  maxHeight: 120,
                  transition: "border-color 200ms ease, box-shadow 200ms ease",
                }}
              />

              <button
                className="hrm-icon-btn"
                onClick={() => sendChat()}
                disabled={!isInputActive}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: "none",
                  background: isInputActive ? "#10B981" : "#E2E8F0",
                  color: isInputActive ? "white" : "#94A3B8",
                  cursor: isInputActive ? "pointer" : "not-allowed",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 200ms ease",
                }}
              >
                <SendIcon />
              </button>
            </div>
          </div>

          {/* Right Side: Artifact View (PDF) */}
          {activeFileBase64 && (
            <div style={{ 
              flex: "0 0 50%", 
              background: "#F1F5F9", 
              display: "flex", 
              flexDirection: "column",
              animation: "hrm-card-slide 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              overflow: "hidden"
            }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <PlainPDFViewer fileBase64={activeFileBase64} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
