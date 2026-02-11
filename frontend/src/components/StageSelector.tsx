"use client";

import { useMemo, useRef, useState, useEffect } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

const STAGES = [
  "スメーシーワールド",
  "ゴンズイ地区",
  "マヒマヒリゾート＆スパ",
  "マサバ海峡大橋",
  "ザトウマーケット",
  "チョウザメ造船",
  "キンメダイ美術館",
  "ナメロウ金属",
  "マテガイ放水路",
  "海女美術大学",
  "ヤガラ市場",
  "ユノハナ大渓谷",
  "クサヤ温泉",
  "ヒラメが丘団地",
  "マンタマリア号",
  "ナンプラー遺跡",
  "タラポートショッピングパーク",
  "コンブトラック",
  "オヒョウ海運",
  "タカアシ経済特区",
  "バイガイ亭",
  "ネギトロ炭鉱",
  "カジキ空港",
  "リュウグウターミナル",
  "デカライン高架下",
];

export default function StageSelector({
  value,
  onChange,
  placeholder = "ステージを選択",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const lq = q.trim().toLowerCase();
    if (!lq) return STAGES;
    return STAGES.filter((s) => s.toLowerCase().includes(lq));
  }, [q]);

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
          <div className="p-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`検索: ${placeholder}`}
              className="w-full rounded-full border bg-white px-4 py-2 text-sm"
            />
          </div>

          <div className="max-h-56 overflow-y-auto border-t">
            {filtered.map((s) => {
              const active = s === value;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    onChange(s);
                    setOpen(false);
                    setQ("");
                  }}
                  className={`w-full text-left px-4 py-3 text-sm transition hover:bg-slate-50 ${
                    active ? "bg-slate-100 font-semibold" : ""
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
