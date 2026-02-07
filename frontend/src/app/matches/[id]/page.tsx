"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { ResultBadge } from "@/components/ui/ResultBadge";
import { RatingBadge } from "@/components/ui/RatingBadge";

type Match = {
  id: number;
  played_at: string | null;
  mode: string | null;
  rule: string | null;
  stage: string | null;
  weapon: string | null;
  is_win: boolean | null;
  note: string | null;
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

export default function MatchDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<MatchDetailRes | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "unauth" | "error">(
    "loading"
  );

  // note編集用
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const playedAtText = useMemo(() => {
    if (!data?.match.played_at) return "-";
    return formatPlayedAt(data.match.played_at);
  }, [data?.match.played_at]);

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        const res = await api.get<MatchDetailRes>(`/api/matches/${id}`);
        setData(res.data);
        setNoteDraft(res.data.match.note ?? "");
        setStatus("ok");
      } catch (e: any) {
        const code = e?.response?.status;
        if (code === 401) setStatus("unauth");
        else setStatus("error");
      }
    };

    fetchDetail();
  }, [id]);

  const saveNote = async () => {
    if (!data) return;

    try {
      setSavingNote(true);

      const res = await api.patch<{ id: number; note: string | null }>(
        `/api/matches/${data.match.id}`,
        { note: noteDraft.trim() === "" ? null : noteDraft }
      );

      setData({
        ...data,
        match: { ...data.match, note: res.data.note },
      });

      setIsEditingNote(false);
    } catch (e) {
      alert("試合の記録に失敗しました");
    } finally {
      setSavingNote(false);
    }
  };

  /* ------- 状態表示（Cardで統一） ------- */
  if (status === "loading") {
    return (
      <div className="space-y-4">
        <PageHeader title="この試合の振り返り" right={<Link href="/matches" className="underline-offset-4 hover:underline text-sm font-semibold">試合ログへ</Link>} />
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </Card>
      </div>
    );
  }

  if (status === "unauth") {
    return (
      <div className="space-y-4">
        <PageHeader title="この試合の振り返り" description="ログインが必要です" />
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">ログインしてね。</p>
          <div className="mt-4">
            <Link
              className="inline-flex items-center justify-center rounded-full btn btn-primary px-4 text-sm font-semibold transition hover:shadow-sm"
              href="/login"
            >
              /loginへ
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (status === "error" || !data) {
    return (
      <div className="space-y-4">
        <PageHeader title="この試合の振り返り" description="読み込みに失敗しました" />
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            データの取得に失敗したかも。
          </p>
          <div className="mt-4">
            <Link
              className="inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
              href="/matches"
            >
              試合ログへ戻る
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const { match, ratings } = data;

  return (
    <div className="space-y-6">
        <PageHeader
        title="この試合の振り返り"
        description={match.played_at ? `日時：${playedAtText}` : undefined}
        right={
          <Link
            href="/matches"
            className="inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
          >
            試合ログへ
          </Link>
        }
      />

      {/* 試合情報 */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold">
                {match.rule ?? "-"} / {match.stage ?? "-"}
              </p>
              <ResultBadge isWin={match.is_win} />
            </div>

            <p className="text-sm text-muted-foreground">
              {match.mode ?? "-"} / {match.weapon ?? "-"}
            </p>

            <p className="text-sm text-muted-foreground">
              日時：{match.played_at ? playedAtText : "-"}
            </p>
          </div>

          <span className="text-sm text-muted-foreground">›</span>
        </div>
      </Card>

      {/* メモ */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">メモ</h2>

          {!isEditingNote ? (
            <button
              className="text-sm font-semibold underline-offset-4 hover:underline"
              onClick={() => setIsEditingNote(true)}
              type="button"
            >
              編集
            </button>
          ) : (
            <button
              className="text-sm font-semibold underline-offset-4 hover:underline disabled:opacity-50"
              disabled={savingNote}
              onClick={() => {
                setIsEditingNote(false);
                setNoteDraft(match.note ?? "");
              }}
              type="button"
            >
              キャンセル
            </button>
          )}
        </div>

        {!isEditingNote ? (
          <div className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
            {match.note && match.note.trim() !== "" ? match.note : "なし"}
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <textarea
              className="w-full rounded-2xl border bg-white p-3 text-sm"
              rows={6}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
            />

            <div className="flex gap-2">
              <button
                className="inline-flex items-center justify-center rounded-full btn btn-primary px-4 text-sm font-semibold transition hover:shadow-sm disabled:opacity-50"
                onClick={saveNote}
                disabled={savingNote}
                type="button"
              >
                {savingNote ? "試合を記録中..." : "試合を記録"}
              </button>

              <Link
                href="/matches"
                className="inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
              >
                試合ログへ
              </Link>
            </div>
          </div>
        )}
      </Card>

      {/* 課題評価 */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold">課題評価</h2>

        {ratings.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">評価なし</p>
        ) : (
          <div className="mt-4 space-y-3">
            {ratings.map((r) => (
              <div
                key={r.task_id}
                className="flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {r.title ?? `Task#${r.task_id}`}
                  </p>
                </div>
                <RatingBadge rating={r.rating} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
