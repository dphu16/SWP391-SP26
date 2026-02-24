import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getToken, removeToken } from "../services/authService";
import { decodeJwt } from "../utils/jwtDecode";
// ─── Breadcrumb config ────────────────────────────────────────────────────────
const breadcrumbMap: Record<
  string,
  { label: string; parent?: string; parentPath?: string }
> = {
  "/dashboard":   { label: "Dashboard" },
  "/employees":   { label: "Directory",   parent: "Employees" },
  "/onboarding":  { label: "Onboarding",  parent: "Employees" },
  "/offboarding": { label: "Offboarding", parent: "Employees" },
};

// ─── Current user derived from JWT ──────────────────────────────────────────
function useCurrentUser() {
  const payload = decodeJwt(getToken());
  return {
    name:       payload?.fullName ?? payload?.sub ?? "User",
    role:       payload?.role     ?? "—",
    avatarUrl:  payload?.avatarUrl ?? "",
    employeeId: payload?.employeeId ?? null as string | null,
  };
}


// ─── SVG Icons ────────────────────────────────────────────────────────────────
const ChevronDownIcon = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 16 16"
    fill="currentColor"
    className={`w-3.5 h-3.5 text-text-secondary-light dark:text-text-secondary-dark transition-transform duration-200 ${
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
        ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
        : "text-text-primary-light dark:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-800"
    }`}
  >
    <span
      className={`flex-shrink-0 ${
        variant === "danger"
          ? "text-rose-500"
          : "text-text-secondary-light dark:text-text-secondary-dark group-hover:text-text-primary-light dark:group-hover:text-text-primary-dark"
      } transition-colors`}
    >
      {icon}
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium leading-none">{label}</p>
      {description && (
        <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark mt-0.5 leading-none">
          {description}
        </p>
      )}
    </div>
  </button>
);

// ─── Header ───────────────────────────────────────────────────────────────────
const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();  // ← real JWT data

  const [darkMode, setDarkMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const crumb =
    breadcrumbMap[location.pathname] ??
    (location.pathname.startsWith("/employee/")
      ? { label: "Employee Detail", parent: "Employees" }
      : { label: "Page" });

  // ── Dark mode ──
  const toggleDark = () => {
    setDarkMode((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

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
    setDrawerOpen(true);
    navigate(`/employee/${currentUser.employeeId}`);
  }, []);


  // Deterministic avatar color (fallback when no image)
  const avatarColors = [
    "bg-primary/15 text-primary",
    "bg-blue-100 text-blue-600",
    "bg-purple-100 text-purple-600",
  ];
  const avatarColor =
    avatarColors[(currentUser.name.charCodeAt(0) ?? 0) % avatarColors.length];
  const avatarInitials = currentUser.name.slice(0, 2).toUpperCase();

  return (
    <>
      <header className="h-16 flex-shrink-0 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark flex items-center justify-between px-6 z-30">
        {/* ── Left: Breadcrumb ── */}
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-sm">
            {crumb.parent && (
              <>
                <li>
                  <span className="font-medium text-text-secondary-light dark:text-text-secondary-dark">
                    {crumb.parent}
                  </span>
                </li>
                <li>
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-3.5 h-3.5 text-text-muted-light dark:text-text-muted-dark"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </li>
              </>
            )}
            <li>
              <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                {crumb.label}
              </span>
            </li>
          </ol>
        </nav>

        {/* ── Right: Actions ── */}
        <div className="flex items-center gap-2">

          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            className="p-2 rounded-lg text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors cursor-pointer"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]">
                <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.061 1.06l1.06 1.06z" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]">
                <path
                  fillRule="evenodd"
                  d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          {/* Notifications */}
          <button
            className="relative p-2 rounded-lg text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]">
              <path
                fillRule="evenodd"
                d="M4 8a6 6 0 1112 0c0 1.887.454 3.665 1.257 5.234a.75.75 0 01-.515 1.076 32.91 32.91 0 01-3.256.508 3.5 3.5 0 01-6.972 0 32.903 32.903 0 01-3.256-.508.75.75 0 01-.515-1.076A11.448 11.448 0 004 8zm6 7c-.655 0-1.305-.02-1.95-.057a2 2 0 003.9 0c-.645.038-1.295.057-1.95.057z"
                clipRule="evenodd"
              />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-surface-light dark:border-surface-dark" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-border-light dark:bg-border-dark mx-1" />

          {/* ── Avatar + Dropdown trigger ── */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="user-menu-button"
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              aria-controls="user-dropdown"
              onClick={() => setDropdownOpen((o) => !o)}
              className={`flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl transition-colors cursor-pointer group ${
                dropdownOpen
                  ? "bg-gray-100 dark:bg-gray-800"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
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
                <div className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark leading-none">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark leading-none mt-0.5">
                  {currentUser.role}
                </div>
              </div>

              <ChevronDownIcon open={dropdownOpen} />
            </button>

            <div
              id="user-dropdown"
              role="menu"
              aria-labelledby="user-menu-button"
              className={`absolute right-0 top-full mt-2 w-64 bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-dropdown overflow-hidden transition-all duration-200 origin-top-right z-50 ${
                dropdownOpen
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              }`}
            >
              {/* User identity header */}
              <div className="px-4 py-3.5 border-b border-border-light dark:border-border-dark">
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
                    <p className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark truncate">
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
                  onClick={() => setDropdownOpen(false)}
                />
              </div>

              {/* Divider + logout */}
              <div className="border-t border-border-light dark:border-border-dark p-2">
                <MenuItem
                  icon={<LogoutIcon />}
                  label="Sign Out"
                  onClick={() => {
                    setDropdownOpen(false);
                    removeToken();
                    navigate("/login", { replace: true });
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
