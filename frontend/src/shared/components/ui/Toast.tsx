import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
  dismissing?: boolean;
}

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const icons: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
    </svg>
  ),
};

const variantStyles: Record<ToastVariant, { icon: string; bar: string; bg: string; border: string }> = {
  success: {
    icon: "text-emerald-500",
    bar: "bg-emerald-500",
    bg: "bg-white dark:bg-gray-900",
    border: "border-emerald-100 dark:border-emerald-900/40",
  },
  error: {
    icon: "text-rose-500",
    bar: "bg-rose-500",
    bg: "bg-white dark:bg-gray-900",
    border: "border-rose-100 dark:border-rose-900/40",
  },
  warning: {
    icon: "text-amber-500",
    bar: "bg-amber-500",
    bg: "bg-white dark:bg-gray-900",
    border: "border-amber-100 dark:border-amber-900/40",
  },
  info: {
    icon: "text-blue-500",
    bar: "bg-blue-500",
    bg: "bg-white dark:bg-gray-900",
    border: "border-blue-100 dark:border-blue-900/40",
  },
};

// ─── Single Toast ─────────────────────────────────────────────────────────────
const ToastCard: React.FC<{ item: ToastItem; onDismiss: (id: string) => void }> = ({
  item,
  onDismiss,
}) => {
  const duration = item.duration ?? 4000;
  const styles = variantStyles[item.variant];
  const [progress, setProgress] = useState(100);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct > 0) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        onDismiss(item.id);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [duration, item.id, onDismiss]);

  return (
    <div
      className={`relative flex items-start gap-3 w-80 rounded-xl border shadow-lg p-4 overflow-hidden cursor-pointer select-none
        ${styles.bg} ${styles.border}
        ${item.dismissing ? "animate-slide-out-right" : "animate-slide-in-right"}
      `}
      onClick={() => onDismiss(item.id)}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <span className={`flex-shrink-0 mt-0.5 ${styles.icon}`}>
        {icons[item.variant]}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">
          {item.title}
        </p>
        {item.message && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {item.message}
          </p>
        )}
      </div>

      {/* Close button */}
      <button
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
        onClick={(e) => { e.stopPropagation(); onDismiss(item.id); }}
        aria-label="Dismiss notification"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
          <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
        </svg>
      </button>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${styles.bar} transition-none`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, dismissing: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 280);
  }, []);

  const toast = useCallback(
    (opts: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev.slice(-4), { ...opts, id }]);
    },
    []
  );

  const success = useCallback((title: string, message?: string) => toast({ variant: "success", title, message }), [toast]);
  const error   = useCallback((title: string, message?: string) => toast({ variant: "error",   title, message }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ variant: "warning", title, message }), [toast]);
  const info    = useCallback((title: string, message?: string) => toast({ variant: "info",    title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {/* Toast Container */}
      <div
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none"
        aria-label="Notifications"
      >
        {toasts.map((item) => (
          <div key={item.id} className="pointer-events-auto">
            <ToastCard item={item} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
