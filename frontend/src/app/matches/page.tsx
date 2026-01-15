"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

type Match = {
  id: number;
  played_at: string | null;
  mode: string | null;
  rule: string | null;
  stage: string | null;
  weapon: string | null;
  is_win: boolean | null;
};

// JSTズレしにくい YYYY-MM-DD を作る
function ymdLocal(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export default function MatchesPage() {
  const [date, setDate] = useState<string>(() => ymdLocal(new Date()));
  const [matches, setMatches] = useState<Match[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "unauth" | "error">(
    "loading"
  );

  useEffect(() => {
    const fetchMatches = async () => {
      setStatus("loading");
      try {
        // ★ここがポイント：params で date を渡す
        const res = await api.get<Match[]>("/api/matches", { params: { date } });
        setMatches(res.data);
        setStatus("ok");
      } catch (e: any) {
        const code = e?.response?.status;
        if (code === 401) setStatus("unauth");
        else setStatus("error");
      }
    };

    fetchMatches();
  }, [date]);

  const setToday = () => setDate(ymdLocal(new Date()));
  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setDate(ymdLocal(d));
  };

  if (status === "unauth")
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
        <div className="max-w-xl mx-auto">
          <div className="mb-3">ログインしてね</div>
          <Link className="underline" href="/login">
            /loginへ
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">試合一覧（{date}）</h1>
          <Link className="underline" href="/dashboard">
            ホームへ
          </Link>
        </div>

        {/* 日付切替 */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={setToday}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15"
            >
              今日
            </button>
            <button
              onClick={setYesterday}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15"
            >
              昨日
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-white/70">任意日</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* 一覧 */}
        <div className="space-y-3">
          {status === "loading" && (
            <div className="text-sm text-white/60">読み込み中…</div>
          )}

          {status === "error" && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4">
              <div className="font-semibold mb-1">読み込み失敗</div>
              <div className="text-sm text-white/70">
                /api/matches?date= が叩けてるか Network で見てみて！
              </div>
            </div>
          )}

          {status === "ok" && matches.length === 0 && (
            <div className="text-sm text-white/60">この日の試合はなし</div>
          )}

          {status === "ok" &&
            matches.map((m) => (
              <div
                key={m.id}
                className="relative rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between"
              >
                {/* ★一覧→詳細導線 */}
                <Link className="absolute inset-0" href={`/matches/${m.id}`}>
                  詳細
                </Link>

                <div className="space-y-1">
                  <div className="text-sm text-white/70">
                    {m.played_at ? new Date(m.played_at).toLocaleString() : "-"}
                  </div>
                  <div className="font-medium">
                    {m.rule ?? "-"} / {m.stage ?? "-"}
                  </div>
                  <div className="text-sm text-white/60">
                    {m.mode ?? "-"} / {m.weapon ?? "-"}
                  </div>
                </div>

                <div className="text-lg font-bold">
                  {m.is_win === null ? "-" : m.is_win ? "WIN" : "LOSE"}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
