"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ToastType = "error" | "success";

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "error") => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3 text-sm shadow-lg",
              t.type === "error" ? "border-[var(--salmon)]" : "border-[var(--ink)]"
            )}
          >
            <span className={t.type === "error" ? "text-[var(--salmon)]" : "text-[var(--ink)]"}>
              {t.message}
            </span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-sm font-semibold text-muted-foreground hover:underline"
            >
              閉じる
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
