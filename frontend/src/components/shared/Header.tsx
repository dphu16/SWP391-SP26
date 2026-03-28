import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, removeToken, getRefreshToken } from "../../services/authService";
import { broadcastLogout } from "../../services/authService";
import { decodeJwt } from "../../utils/jwtDecode";
import apiClient, { setLoggingOut } from "../../services/apiClient";
import Breadcrumb from "../navigation/Breadcrumb";


// ─── Current user derived from JWT ──────────────────────────────────────────
function useCurrentUser() {
  const payload = decodeJwt(getToken());

  const getFullAvatarUrl = (url: string | undefined) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    // Assuming backend is at http://localhost:8080 or same as API client host
    return `http://localhost:8080${url}`;
  };

  if (!payload) {
    return {
      name: "User",
      role: "—",
      avatarUrl: "",
      employeeId: null as string | null,
    };
  }
  return {
    name: payload.fullName ?? payload.sub ?? "User",
    role:
      payload.roles && payload.roles.length > 0
        ? payload.roles[0].replace("ROLE_", "")
        : "—",
    avatarUrl: getFullAvatarUrl(payload.avatarUrl),
    employeeId: payload.employeeId ?? null,
  };
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const ChevronDownIcon = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 16 16"
    fill="currentColor"
    className={`w-3.5 h-3.5 text-text-secondary-light transition-transform duration-200 ${
      open ? "rotate-180" : ""
    }`}
  >
    <path
      fillRule="evenodd"
      d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2-3a2 2 0 11-4 0 2 2 0 014 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4z" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path
      fillRule="evenodd"
      d="M7.429 1.525a6.593 6.593 0 011.142 0c.036.003.108.036.137.146l.289 1.105c.147.56.55.967.997 1.189.174.086.341.178.502.274.45.268.987.438 1.546.25l1.094-.362a.145.145 0 01.159.048 6.583 6.583 0 01.571.99.145.145 0 01-.047.16l-.888.654c-.462.34-.673.894-.617 1.417.03.271.046.548.046.83 0 .282-.016.559-.046.83-.056.523.155 1.077.617 1.418l.888.653a.145.145 0 01.047.161 6.583 6.583 0 01-.571.989.145.145 0 01-.16.049l-1.093-.363c-.56-.187-1.097-.017-1.547.25-.161.097-.328.188-.502.274-.447.222-.85.629-.997 1.189l-.289 1.105c-.029.11-.101.143-.137.146a6.593 6.593 0 01-1.142 0c-.036-.003-.108-.036-.137-.146l-.289-1.105c-.147-.56-.55-.967-.997-1.189a4.502 4.502 0 01-.502-.274c-.45-.268-.987-.438-1.546-.25l-1.094.362a.145.145 0 01-.159-.048 6.583 6.583 0 01-.571-.99.145.145 0 01.047-.16l.888-.654c.462-.34.673-.894.617-1.417A6.507 6.507 0 012 8c0-.282.016-.559.046-.83.056-.523-.155-1.077-.617-1.418l-.888-.653a.145.145 0 01-.047-.161 6.583 6.583 0 01.571-.989.145.145 0 01.16-.049l1.093.363c.56.187 1.097.017 1.547-.25.161-.097.328-.188.502-.274.447-.222.85-.629.997-1.189l.289-1.105c.029-.11.101-.143.137-.146zM8 6a2 2 0 100 4 2 2 0 000-4z"
      clipRule="evenodd"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path
      fillRule="evenodd"
      d="M2 2.75C2 1.784 2.784 1 3.75 1h5.5a.75.75 0 010 1.5h-5.5a.25.25 0 00-.25.25v10.5c0 .138.112.25.25.25h5.5a.75.75 0 010 1.5h-5.5A1.75 1.75 0 012 13.25V2.75zm10.44 4.5H6.75a.75.75 0 000 1.5h5.69l-1.97 1.97a.75.75 0 101.06 1.06l3.25-3.25a.75.75 0 000-1.06l-3.25-3.25a.75.75 0 10-1.06 1.06l1.97 1.97z"
      clipRule="evenodd"
    />
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// ─── Dropdown Menu Item ───────────────────────────────────────────────────────
interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
  variant?: "default" | "danger";
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  description,
  onClick,
  variant = "default",
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer group ${
      variant === "danger"
        ? "text-rose-600 hover:bg-rose-50 "
        : "text-text-primary-light hover:bg-gray-100 "
    }`}
  >
    <span
      className={`flex-shrink-0 ${
        variant === "danger"
          ? "text-rose-500"
          : "text-text-secondary-light group-hover:text-text-primary-light "
      } transition-colors`}
    >
      {icon}
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium leading-none">{label}</p>
      {description && (
        <p className="text-[11px] text-text-secondary-light mt-0.5 leading-none">
          {description}
        </p>
      )}
    </div>
  </button>
);

// ─── Header ───────────────────────────────────────────────────────────────────
const Header: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useCurrentUser(); // ← real JWT data

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // ── Close dropdown on Escape ──
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dropdownOpen]);

  const openProfile = useCallback(() => {
    setDropdownOpen(false);
    if (currentUser.employeeId) {
      navigate(`/employee/${currentUser.employeeId}`);
    } else {
      navigate(`/profile`);
    }
  }, [navigate, currentUser.employeeId]);

  const avatarColors = [
    "bg-primary/15 text-primary",
    "bg-blue-100 text-blue-600",
    "bg-purple-100 text-purple-600",
  ];
  const avatarColor =
    avatarColors[(currentUser.name.charCodeAt(0) ?? 0) % avatarColors.length];
  const avatarInitials = currentUser.name.slice(0, 2).toUpperCase();

  const isAiChat = location.pathname === "/ai-chat";

  return (
    <>
      <header className="relative h-16 flex-shrink-0 bg-surface-light border-b border-border-light flex items-center justify-between px-6 z-30">
        {/* ── Left: Breadcrumb / Portal Slot ── */}
        <div className="flex items-center gap-4">
          {!isAiChat && <Breadcrumb />}
          <div id="ai-chat-header-left" className="empty:hidden" />
        </div>

        {/* ── Right: Actions ── */}
        <div className="flex items-center gap-2">
          <div id="ai-chat-header-right" className="empty:hidden" />
          {/* AI Chat (Visible to HR and MANAGER only) */}
          {!isAiChat && (currentUser.role === "HR") && (
            <button
              className="relative p-2 rounded-lg text-text-secondary-light hover:bg-gray-100 hover:text-text-primary-light transition-colors cursor-pointer"
              aria-label="AI Chat"
              onClick={() => navigate("/ai-chat")}
            >
              <ChatIcon />
            </button>
          )}


          {/* Divider */}
          <div className="w-px h-6 bg-border-light mx-1" />

          {/* ── Avatar + Dropdown trigger ── */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="user-menu-button"
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              aria-controls="user-dropdown"
              onClick={() => setDropdownOpen((o) => !o)}
              className={`flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl transition-colors cursor-pointer group ${
                dropdownOpen ? "bg-gray-100 " : "hover:bg-gray-100 "
              }`}
            >
              {/* Avatar */}
              {currentUser.avatarUrl ? (
                <img
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-primary/20"
                  src={currentUser.avatarUrl}
                />
              ) : (
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-primary/20 ${avatarColor}`}
                >
                  {avatarInitials}
                </div>
              )}

              {/* Name + role */}
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-text-primary-light leading-none">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-text-secondary-light leading-none mt-0.5">
                  {currentUser.role}
                </div>
              </div>

              <ChevronDownIcon open={dropdownOpen} />
            </button>

            <div
              id="user-dropdown"
              role="menu"
              aria-labelledby="user-menu-button"
              className={`absolute right-0 top-full mt-2 w-64 bg-surface-light rounded-2xl border border-border-light shadow-dropdown overflow-hidden transition-all duration-200 origin-top-right z-50 ${
                dropdownOpen
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              }`}
            >
              {/* User identity header */}
              <div className="px-4 py-3.5 border-b border-border-light ">
                <div className="flex items-center gap-3">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/20 flex-shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor}`}
                    >
                      {avatarInitials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-text-primary-light truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-text-secondary-light truncate">
                      {currentUser.role}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-2 space-y-0.5">
                <MenuItem
                  icon={<UserIcon />}
                  label="My Profile"
                  
                  onClick={openProfile}
                />
                <MenuItem
                  icon={<SettingsIcon />}
                  label="Settings"
                  
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/settings/account");
                  }}
                />
              </div>

              {/* Logout */}
              <div className="border-t border-border-light p-2">
                <MenuItem
                  icon={<LogoutIcon />}
                  label="Logout"
                  onClick={async () => {
                    setDropdownOpen(false);

                    // ── Step 1: Set logout guard FIRST to prevent the Axios interceptor
                    //    from auto-refreshing the access token during the API call ──
                    setLoggingOut(true);

                    // ── Step 2: Clear all tokens from storage immediately so that no
                    //    in-flight request or background poll can use them ──
                    const refreshToken = getRefreshToken();
                    removeToken();
                    localStorage.removeItem("hrm_ai_messages");
                    localStorage.removeItem("hrm_ai_activeExtractedData");
                    localStorage.removeItem("hrm_ai_activeFileBase64");

                    // ── Step 2b: Broadcast logout to all other tabs (BroadcastChannel + storage event) ──
                    broadcastLogout();

                    // ── Step 3: Tell the backend to invalidate the refresh token in DB ──
                    try {
                      await apiClient.post("/api/auth/logout", { refreshToken });
                    } catch (error) {
                      // Even if the API call fails, the user is already logged out locally
                      console.error("Logout API error (ignored):", error);
                    } finally {
                      setLoggingOut(false);
                      navigate("/login", { replace: true });
                    }
                  }}
                  variant="danger"
                />
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
