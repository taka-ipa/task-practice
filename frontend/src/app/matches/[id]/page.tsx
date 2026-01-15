"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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

type Rating = {
  task_id: number;
  title: string | null;
  rating: "○" | "△" | "×" | "-";
};

type MatchDetailRes = {
  match: Match;
  ratings: Rating[];
};

export default function MatchDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<MatchDetailRes | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "unauth" | "error">(
    "loading"
  );

  const playedAtText = useMemo(() => {
    if (!data?.match.played_at) return "-";
    return new Date(data.match.played_at).toLocaleString();
  }, [data?.match.played_at]);

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        const res = await api.get<MatchDetailRes>(`/api/matches/${id}`);
        setData(res.data);
        setStatus("ok");
      } catch (e: any) {
        const code = e?.response?.status;
        if (code === 401) setStatus("unauth");
        else setStatus("error");
      }
    };

    fetchDetail();
  }, [id]);

  if (status === "loading") return <div className="p-6">Loading...</div>;
  if (status === "unauth")
    return (
      <div className="p-6">
        <div className="mb-3">ログインしてね</div>
        <Link className="underline" href="/login">
          /loginへ
        </Link>
      </div>
    );
  if (status === "error" || !data)
    return (
      <div className="p-6">
        <div className="mb-3">読み込み失敗</div>
        <Link className="underline" href="/matches">
          一覧へ戻る
        </Link>
      </div>
    );

  const { match, ratings } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">試合詳細</h1>
          <Link className="underline" href="/matches">
            一覧へ
          </Link>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
          <div>日時：{playedAtText}</div>
          <div>ルール：{match.rule ?? "-"}</div>
          <div>ステージ：{match.stage ?? "-"}</div>
          <div>モード：{match.mode ?? "-"}</div>
          <div>武器：{match.weapon ?? "-"}</div>
          <div>
            結果：
            {match.is_win === null ? "-" : match.is_win ? "勝ち" : "負け"}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="font-semibold mb-3">課題評価（readonly）</h2>

          {ratings.length === 0 ? (
            <div className="text-sm text-white/60">評価なし</div>
          ) : (
            <div className="space-y-2">
              {ratings.map((r) => (
                <div
                  key={r.task_id}
                  className="flex items-center justify-between border-b border-white/10 pb-2 last:border-b-0 last:pb-0"
                >
                  <div className="text-sm">{r.title ?? `Task#${r.task_id}`}</div>
                  <div className="text-lg font-bold">{r.rating}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
