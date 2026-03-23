"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { ResultBadge } from "@/components/ui/ResultBadge";
import { RatingBadge } from "@/components/ui/RatingBadge";
import StageSelector from "@/components/StageSelector";
import RuleSelector from "@/components/RuleSelector";
import ModeSelector from "@/components/ModeSelector";
import WeaponSelector from "@/components/WeaponSelector";

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
  // match, note, ratings の個別編集フラグとドラフト
  const [isEditingMatch, setIsEditingMatch] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isEditingRatings, setIsEditingRatings] = useState(false);

  const [matchDraft, setMatchDraft] = useState<Match | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [ratingsDraft, setRatingsDraft] = useState<Record<number, Rating['rating']>>({});

  const [savingMatch, setSavingMatch] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [savingRatings, setSavingRatings] = useState(false);

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
        // prepare drafts
        setMatchDraft(res.data.match);
        setNoteDraft(res.data.match.note ?? "");
        const map: Record<number, Rating['rating']> = {};
        for (const r of res.data.ratings) map[r.task_id] = r.rating;
        setRatingsDraft(map);
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
      const res = await api.patch(`/api/matches/${data.match.id}`, { note: noteDraft.trim() === "" ? null : noteDraft });
      setData({ ...data, match: { ...data.match, note: res.data.note } });
      setIsEditingNote(false);
    } catch (e) {
      alert('メモの保存に失敗しました');
    } finally {
      setSavingNote(false);
    }
  };

  const setDraftRating = (taskId: number, rating: Rating['rating']) => {
    setRatingsDraft((p) => ({ ...p, [taskId]: rating }));
  };

  const saveMatch = async () => {
    if (!data || !matchDraft) return;
    try {
      setSavingMatch(true);
      const payload: any = {
        // Do not send played_at (日時は変更しない)
        mode: matchDraft.mode,
        rule: matchDraft.rule,
        stage: matchDraft.stage,
        weapon: matchDraft.weapon,
        is_win: matchDraft.is_win,
      };

      await api.patch(`/api/matches/${data.match.id}`, payload);

      // refetch to update
      const fresh = await api.get<MatchDetailRes>(`/api/matches/${id}`);
      setData(fresh.data);
      setMatchDraft(fresh.data.match);
      setIsEditingMatch(false);
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.message || '試合情報の更新に失敗しました');
    } finally {
      setSavingMatch(false);
    }
  };

  const saveRatings = async () => {
    if (!data) return;
    try {
      setSavingRatings(true);
      const payload: any = {};
      payload.ratings = Object.entries(ratingsDraft).map(([taskId, rating]) => ({ task_id: Number(taskId), rating }));
      await api.patch(`/api/matches/${data.match.id}`, payload);

      // refetch to update ratings
      const fresh = await api.get<MatchDetailRes>(`/api/matches/${id}`);
      setData(fresh.data);
      const map: Record<number, Rating['rating']> = {};
      for (const r of fresh.data.ratings) map[r.task_id] = r.rating;
      setRatingsDraft(map);
      setIsEditingRatings(false);
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.message || '評価の更新に失敗しました');
    } finally {
      setSavingRatings(false);
    }
  };

  /* ------- 状態表示（Cardで統一） ------- */
    if (status === "loading") {
    return (
      <div className="space-y-4">
        <PageHeader title="このバトルの振り返り" right={<Link href="/matches" className="underline-offset-4 hover:underline text-sm font-semibold">バトルログへ</Link>} />
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </Card>
      </div>
    );
  }

  if (status === "unauth") {
    return (
      <div className="space-y-4">
        <PageHeader title="このバトルの振り返り" description="ログインが必要です" />
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
        <PageHeader title="このバトルの振り返り" description="読み込みに失敗しました" />
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            データの取得に失敗したかも。
          </p>
          <div className="mt-4">
            <Link
              className="inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
              href="/matches"
            >
              バトルログへ戻る
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
        title="このバトルの振り返り"
        description={match.played_at ? `日時：${playedAtText}` : undefined}
        right={
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full btn px-3 text-sm font-semibold transition hover:shadow-sm"
            >
              ホーム
            </Link>

            <Link
              href="/matches"
              className="inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
            >
              バトルログへ
            </Link>
          </div>
        }
      />

      {/* 試合情報 */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            {!isEditingMatch && (
              <>
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
              </>
            )}

            {isEditingMatch && matchDraft && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <RuleSelector
                    value={matchDraft.rule ?? ""}
                    onChange={(v) => setMatchDraft((p) => p ? { ...p, rule: v } : p)}
                    placeholder="ルール"
                    className="w-full dark:text-[var(--ink)]"
                  />
                  <StageSelector
                    value={matchDraft.stage ?? ""}
                    onChange={(v) => setMatchDraft((p) => p ? { ...p, stage: v } : p)}
                    placeholder="ステージ"
                    className="w-full dark:text-[var(--ink)]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <ModeSelector
                    value={matchDraft.mode ?? ""}
                    onChange={(v) => setMatchDraft((p) => p ? { ...p, mode: v } : p)}
                    placeholder="モード"
                    className="w-full dark:text-[var(--ink)]"
                  />
                  <WeaponSelector
                    value={matchDraft.weapon ?? ""}
                    onChange={(v) => setMatchDraft((p) => p ? { ...p, weapon: v } : p)}
                    placeholder="ブキ"
                    className="w-full dark:text-[var(--ink)]"
                  />
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setMatchDraft((p) => p ? { ...p, is_win: true } : p)}
                    className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-semibold border transition ${matchDraft.is_win ? 'badge-ink' : 'btn'}`}
                  >
                    WIN
                  </button>

                  <button
                    type="button"
                    onClick={() => setMatchDraft((p) => p ? { ...p, is_win: false } : p)}
                    className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-semibold border transition ${matchDraft.is_win === false ? 'badge-salmon' : 'btn'}`}
                  >
                    LOSE
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isEditingMatch ? (
              <>
                <button
                  className="text-sm font-semibold underline-offset-4 hover:underline"
                  onClick={() => {
                    // open match edit, close others
                    setIsEditingMatch(true);
                    setIsEditingNote(false);
                    setIsEditingRatings(false);
                  }}
                >
                  編集
                </button>
              </>
            ) : (
              <>
                <button
                  className="text-sm font-semibold underline-offset-4 hover:underline disabled:opacity-50"
                  disabled={savingMatch}
                  onClick={() => {
                    // cancel: reset drafts from original data
                    setMatchDraft(data?.match ?? null);
                    setNoteDraft(data?.match?.note ?? "");
                    const map: Record<number, Rating['rating']> = {};
                    for (const r of data?.ratings ?? []) map[r.task_id] = r.rating;
                    setRatingsDraft(map);
                    setIsEditingMatch(false);
                  }}
                >
                  キャンセル
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-full btn btn-primary px-4 text-sm font-semibold"
                  onClick={saveMatch}
                  disabled={savingMatch}
                >
                  {savingMatch ? '保存中...' : '保存'}
                </button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* メモ */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">メモ</h2>

          {!isEditingNote ? (
            <button
              className="text-sm font-semibold underline-offset-4 hover:underline"
              onClick={() => {
                setIsEditingNote(true);
                setIsEditingMatch(false);
                setIsEditingRatings(false);
              }}
              type="button"
            >
              編集
            </button>
          ) : (
            <div className="flex gap-2">
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
              <button
                className="inline-flex items-center justify-center rounded-full btn btn-primary px-4 text-sm font-semibold transition hover:shadow-sm disabled:opacity-50"
                onClick={saveNote}
                disabled={savingNote}
                type="button"
              >
                {savingNote ? "メモを保存中..." : "メモを保存"}
              </button>
            </div>
          )}
        </div>

        {!isEditingNote ? (
          <div className="mt-3 break-words whitespace-normal text-sm text-muted-foreground">
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
          </div>
        )}
      </Card>

      {/* 課題評価 */}

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">課題評価</h2>
          <div>
            {!isEditingRatings ? (
              <button
                className="text-sm font-semibold underline-offset-4 hover:underline"
                onClick={() => {
                  setIsEditingRatings(true);
                  setIsEditingMatch(false);
                  setIsEditingNote(false);
                  // ensure drafts are current
                  const map: Record<number, Rating['rating']> = {};
                  for (const r of ratings ?? []) map[r.task_id] = r.rating;
                  setRatingsDraft(map);
                }}
              >
                編集
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  className="text-sm font-semibold underline-offset-4 hover:underline disabled:opacity-50"
                  disabled={savingRatings}
                  onClick={() => {
                    // cancel
                    const map: Record<number, Rating['rating']> = {};
                    for (const r of ratings ?? []) map[r.task_id] = r.rating;
                    setRatingsDraft(map);
                    setIsEditingRatings(false);
                  }}
                >
                  キャンセル
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-full btn btn-primary px-4 text-sm font-semibold"
                  onClick={saveRatings}
                  disabled={savingRatings}
                >
                  {savingRatings ? '保存中...' : '保存'}
                </button>
              </div>
            )}
          </div>
        </div>

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
                <div className="flex gap-2">
                  {isEditingRatings ? (
                    (["○", "△", "×", "-"] as Rating['rating'][]).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setDraftRating(r.task_id, val)}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition ${ratingsDraft[r.task_id] === val ? 'bg-[var(--ink)] text-[var(--ink-foreground)] border-transparent' : 'bg-white text-[var(--foreground)]'}`}
                      >
                        {val}
                      </button>
                    ))
                  ) : (
                    <RatingBadge rating={r.rating} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
