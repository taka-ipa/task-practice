"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

type Match = {
  id: number;
  played_at: string | null;
  rule: string | null;
  stage: string | null;
  is_win: boolean | null;
};

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "unauth" | "error">(
    "loading"
  );

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await api.get<Match[]>("/api/matches");
        setMatches(res.data);
        setStatus("ok");
      } catch (e: any) {
        const code = e?.response?.status;
        if (code === 401) setStatus("unauth");
        else setStatus("error");
      }
    };

    fetchMatches();
  }, []);

  if (status === "loading") return <div className="p-6">loading...</div>;
  if (status === "unauth") return <div className="p-6">未ログインです</div>;
  if (status === "error") return <div className="p-6">読み込みエラー</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">試合一覧</h1>

      {matches.length === 0 ? (
        <div className="text-sm text-muted-foreground">試合がありません</div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border p-4 flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="text-sm">
                  {m.played_at ? new Date(m.played_at).toLocaleString() : "-"}
                </div>
                <div className="font-medium">
                  {m.rule ?? "-"} / {m.stage ?? "-"}
                </div>
              </div>

              <div className="text-lg font-bold">
                {m.is_win === null ? "-" : m.is_win ? "WIN" : "LOSE"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
