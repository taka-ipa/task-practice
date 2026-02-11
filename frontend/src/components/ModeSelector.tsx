"use client";

import { useRef, useState, useEffect } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

const MODES = ["Xマッチ", "チャレンジ", "オープン", "プラベ"];

export default function ModeSelector({
  value,
  onChange,
  placeholder = "モードを選択",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }

    if (open) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between rounded-full border bg-white px-4 py-2 text-sm"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate ${value ? "" : "text-muted-foreground"}`}>
          {value || placeholder}
        </span>
        <span className="ml-2 text-sm">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 w-full max-w-full rounded-xl border bg-white shadow-lg">
          <div className="max-h-52 overflow-y-auto">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  onChange(m);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm transition hover:bg-slate-50 ${
                  m === value ? "bg-slate-100 font-semibold" : ""
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
