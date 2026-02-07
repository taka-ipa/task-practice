"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { ResultBadge } from "@/components/ui/ResultBadge";

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

function formatPlayedAt(playedAt: string) {
  const s = playedAt.replace(" ", "T");
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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
        const res = await api.get<Match[]>("/api/matches", {
          params: { date },
        });
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

  /* ---------- 未ログイン ---------- */
  if (status === "unauth") {
    return (
      <div className="space-y-4">
        <PageHeader title="試合ログ" description="ログインが必要です" />
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">ログインしてね。</p>
          <div className="mt-4">
            <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full btn btn-primary px-4 text-sm font-semibold transition hover:shadow-sm"
              >
                /loginへ
              </Link>
          </div>
        </Card>
      </div>
    );
  }

  /* ---------- 通常表示 ---------- */
  return (
    <div className="space-y-6">
      <PageHeader
        title={`試合ログ（${date}）`}
        description="日付を切り替えて試合を確認できます"
        right={
          <div className="flex items-center gap-2">
                <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
            >
              ホームへ
            </Link>
            <Link
              href="/matches/new"
              className="inline-flex items-center justify-center rounded-full btn btn-primary px-4 text-sm font-semibold transition hover:shadow-sm"
            >
              ＋ 試合追加
            </Link>
          </div>
        }
      />

      {/* 日付切替 */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={setToday}
            className="btn px-4 text-sm font-semibold transition hover:shadow-sm"
          >
            今日
          </button>
          <button
            onClick={setYesterday}
            className="btn px-4 text-sm font-semibold transition hover:shadow-sm"
          >
            昨日
          </button>

          <div className="ml-auto flex items-center gap-3">
            <div className="text-sm text-muted-foreground">任意日</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 rounded-full border bg-white px-4 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* 一覧 */}
      <div className="space-y-4">
        {status === "loading" && (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">読み込み中…</p>
          </Card>
        )}

        {status === "error" && (
          <Card className="p-6">
            <p className="font-semibold">読み込み失敗</p>
            <p className="mt-1 text-sm text-muted-foreground">
              /api/matches?date= が叩けてるか Network で見てみて！
            </p>
          </Card>
        )}

        {status === "ok" && matches.length === 0 && (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              この日の試合はなし
            </p>
          </Card>
        )}

        {status === "ok" &&
          matches.map((m) => (
            <Link key={m.id} href={`/matches/${m.id}`} className="block">
              <Card className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold">
                        {m.rule ?? "-"} / {m.stage ?? "-"}
                      </p>
                      <ResultBadge isWin={m.is_win} />
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {m.mode ?? "-"} / {m.weapon ?? "-"}
                      {m.played_at
                        ? ` · ${formatPlayedAt(m.played_at)}`
                        : ""}
                    </p>
                  </div>

                  <span className="text-sm text-muted-foreground">›</span>
                </div>
              </Card>
            </Link>
          ))}
      </div>
    </div>
  );
}
