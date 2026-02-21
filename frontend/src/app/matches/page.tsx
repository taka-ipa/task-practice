"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { ResultBadge } from "@/components/ui/ResultBadge";
import StageSelector from "@/components/StageSelector";
import WeaponSelector from "@/components/WeaponSelector";

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
  const [stage, setStage] = useState<string>("");
  const [weapon, setWeapon] = useState<string>("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "unauth" | "error">("loading");
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(5);
  const [lastPage, setLastPage] = useState<number>(1);

  useEffect(() => {
    const fetchMatches = async () => {
      setStatus("loading");
      try {
        const params: any = { page, per_page: perPage };
        if (stage) params.stage = stage;
        if (weapon) params.weapon = weapon;
        const res = await api.get("/api/matches", { params });
        // Laravel の paginator は data, current_page, last_page などを返す
        setMatches(res.data.data ?? []);
        setLastPage(res.data.last_page ?? 1);
        setStatus("ok");
      } catch (e: any) {
        const code = e?.response?.status;
        if (code === 401) setStatus("unauth");
        else setStatus("error");
      }
    };

    fetchMatches();
  }, [stage, weapon, page, perPage]);

  const onStageChange = (v: string) => {
    setStage(v);
    setPage(1);
  };

  const onWeaponChange = (v: string) => {
    setWeapon(v);
    setPage(1);
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
        title={`試合ログ`}
        description="ステージとブキで試合を絞り込めます"
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

      {/* 検索機能 */}
      <Card className="p-5">
          <div className="flex flex-wrap items-center gap-2 w-full">
            <div className="w-72 flex items-center gap-2">
              <div className="flex-1">
                <StageSelector value={stage} onChange={onStageChange} />
              </div>
              {stage && (
                <button
                  type="button"
                  onClick={() => setStage("")}
                  className="inline-flex items-center justify-center rounded-full btn px-3 text-sm font-semibold transition hover:shadow-sm"
                >
                  クリア
                </button>
              )}
            </div>
            <div className="w-72 flex items-center gap-2">
              <div className="flex-1">
                <WeaponSelector value={weapon} onChange={onWeaponChange} />
              </div>
              {weapon && (
                <button
                  type="button"
                  onClick={() => setWeapon("")}
                  className="inline-flex items-center justify-center rounded-full btn px-3 text-sm font-semibold transition hover:shadow-sm"
                >
                  クリア
                </button>
              )}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setStage("");
                  setWeapon("");
                  setPage(1);
                }}
                className="inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
              >
                全クリア
              </button>
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
              {stage || weapon ? "該当する試合はなし" : "最近の試合はまだないよ"}
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
                    </p>
                  </div>

                  <span className="text-sm text-muted-foreground">›</span>
                </div>
              </Card>
            </Link>
          ))}

        {/* ページネーションコントロール */}
        <div className="flex items-center justify-center gap-4">
          <button
            className="btn px-4 text-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            前へ
          </button>
          <div className="text-sm text-muted-foreground">
            {page} / {lastPage}
          </div>
          <button
            className="btn btn-primary px-4 text-sm"
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            disabled={page >= lastPage}
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}
