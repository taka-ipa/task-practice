"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { RatingBadge } from "@/components/ui/RatingBadge";
import StageSelector from "@/components/StageSelector";
import RuleSelector from "@/components/RuleSelector";
import ModeSelector from "@/components/ModeSelector";
import WeaponSelector from "@/components/WeaponSelector";

type Task = {
  id: number;
  title: string;
  description: string | null;
  sort_order: number | null;
};

type Rating = "○" | "△" | "×" | "-";

type MatchForm = {
  played_at: string; // datetime-local (YYYY-MM-DDTHH:mm)
  mode: string;
  rule: string;
  stage: string;
  weapon: string;
  is_win: boolean;
  note?: string;
};

type ApiValidationErrors = Record<string, string[]>;

export default function NewMatchPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const [form, setForm] = useState<MatchForm>({
    played_at: "",
    mode: "",
    rule: "",
    stage: "",
    weapon: "",
    is_win: true,
    note: "",
  });

  // ratings を Record で持つ
  const [ratings, setRatings] = useState<Record<number, Rating>>({});

  const [phase, setPhase] = useState<"setup" | "battle">("setup");

  // 今回のバトルで使う課題の選択状態
  const [selectedTaskIds, setSelectedTaskIds] = useState<Record<number, boolean>>({});

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [lastSavedMatch, setLastSavedMatch] = useState<{
    rule?: string | null;
    stage?: string | null;
    mode?: string | null;
    weapon?: string | null;
    // 前回保存したときに選択されていた課題IDリスト
    selected_task_ids?: number[];
  } | null>(null);
  const [errors, setErrors] = useState<ApiValidationErrors>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [selectionError, setSelectionError] = useState<string>("");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoadingTasks(true);
        const res = await api.get("/api/tasks");
        const raw: any[] = res.data?.data ?? res.data; // dataラップどっちでも耐える
        const list: Task[] = (raw ?? []).map((it) => ({
          id: it.id,
          title: it.title ?? "",
          description: it.description ?? null,
          sort_order: it.sort_order ?? null,
        }));

        setTasks(list);

        // 初期選択（何も選ばない）
        setSelectedTaskIds(() => {
          const m: Record<number, boolean> = {};
          for (const t of list) m[t.id] = false;
          return m;
        });

        // 初期値：未設定のものは "-" 扱い
        setRatings((prev) => {
          const next = { ...prev };
          for (const t of list) {
            if (next[t.id] == null) next[t.id] = "-";
          }
          return next;
        });
      } catch (e) {
        console.error(e);
        setMessage("課題の取得に失敗しました");
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();
  }, []);

  const ratingArray = useMemo(() => {
    return Object.entries(ratings).map(([taskId, rating]) => ({
      task_id: Number(taskId),
      rating,
    }));
  }, [ratings]);

  // 選択された課題のみを送る ratings 配列
  const filteredRatingArray = useMemo(() => {
    return Object.entries(ratings)
      .filter(([taskId]) => selectedTaskIds[Number(taskId)])
      .map(([taskId, rating]) => ({ task_id: Number(taskId), rating }));
  }, [ratings, selectedTaskIds]);

  const taskIndexMap = useMemo(() => {
    const map: Record<number, number> = {};
    filteredRatingArray.forEach((r, i) => {
      map[r.task_id] = i;
    });
    return map;
  }, [filteredRatingArray]);

  const getFieldErrors = (field: string) => {
    return (errors && errors[field]) || [];
  };

  const getRatingsErrors = () => {
    const msgs: string[] = [];
    for (const [k, v] of Object.entries(errors)) {
      if (k.startsWith("ratings")) {
        msgs.push(...(v ?? []));
      }
    }
    return msgs;
  };

  const resetForm = () => {
    setForm({
      played_at: "",
      mode: "",
      rule: "",
      stage: "",
      weapon: "",
      is_win: true,
      note: "",
    });

    // tasks は残ってるので、ratings を "-" に戻す
    setRatings(() => {
      const next: Record<number, Rating> = {};
      for (const t of tasks) next[t.id] = "-";
      return next;
    });

    // 選択状態もリセット
    setSelectedTaskIds(() => {
      const m: Record<number, boolean> = {};
      for (const t of tasks) m[t.id] = false;
      return m;
    });

    setSubmittedOnce(false);
    setErrors({});
    setSelectionError("");
  };

  const onSubmit = async () => {
    setMessage("");
    setSubmittedOnce(true);
    setErrors({});
    setSaving(true);

    try {
      const payload = {
        played_at: form.played_at || null,
        mode: form.mode || null,
        rule: form.rule || null,
        stage: form.stage || null,
        weapon: form.weapon || null,
          is_win: form.is_win,
          note: form.note || null,
        ratings: filteredRatingArray,
      };

      const res = await api.post("/api/matches-with-ratings", payload);
      const saved = res.data;
      setMessage("バトルを記録しました！");

      // 前回の試合情報を保持（次の試合プリセット用）
      setLastSavedMatch({
        rule: saved.rule ?? null,
        stage: saved.stage ?? null,
        mode: saved.mode ?? null,
        weapon: saved.weapon ?? null,
        // 選択状態は filteredRatingArray ではなく selectedTaskIds から取得（"-" の評価でも選択は保持したいため）
        selected_task_ids: Object.entries(selectedTaskIds)
          .filter(([, v]) => v)
          .map(([id]) => Number(id)),
      });

      // 入力はリセット（次の試合へを押したときにプリセットする）
      resetForm();
    } catch (e: any) {
      console.error(e);
      if (e?.response?.status === 422) {
        const apiErrors = e?.response?.data?.errors;
        setErrors(apiErrors ?? {});
        setMessage("入力内容を確認してください");
      } else {
          setMessage("バトルの記録に失敗しました");
      }
    } finally {
      setSaving(false);
    }
  };

  // 「ブキと課題を変えずに次へ」ボタンの処理：前回と同じ課題選択を引き継ぎ、評価は空にしてバトル画面へ
  const gotoNextMatchKeepWeaponAndTasks = () => {
    if (!lastSavedMatch) return;
    const now = new Date();

    setForm((p) => ({
      ...p,
      played_at: formatDatetimeLocal(now),
      rule: lastSavedMatch.rule ?? "",
      stage: lastSavedMatch.stage ?? "",
      mode: lastSavedMatch.mode ?? "",
      weapon: lastSavedMatch.weapon ?? "",
      is_win: true,
      note: "",
    }));

    // 評価は空（"-"）にして、前回選択されていた課題だけ選択状態にする
    const prevSelected = new Set(lastSavedMatch.selected_task_ids ?? []);

    setRatings(() => {
      const next: Record<number, Rating> = {};
      for (const t of tasks) {
        next[t.id] = "-";
      }
      return next;
    });

    setSelectedTaskIds(() => {
      const m: Record<number, boolean> = {};
      for (const t of tasks) m[t.id] = prevSelected.has(t.id);
      return m;
    });

    // 直接バトル画面へ移動
    setPhase("battle");
    // setMessage("前回の武器と課題を引き継ぎました（評価は空です）");
    setLastSavedMatch(null);
  };

  const formatDatetimeLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const gotoNextMatch = () => {
    if (!lastSavedMatch) return;
    const now = new Date();
    setForm((p) => ({
      ...p,
      played_at: formatDatetimeLocal(now),
      rule: lastSavedMatch.rule ?? "",
      stage: lastSavedMatch.stage ?? "",
      mode: lastSavedMatch.mode ?? "",
      weapon: lastSavedMatch.weapon ?? "",
      is_win: true,
      note: "",
    }));

    // ratings/selection はリセットして、準備フェーズへ
    setRatings(() => {
      const next: Record<number, Rating> = {};
      for (const t of tasks) next[t.id] = "-";
      return next;
    });
    setSelectedTaskIds(() => {
      const m: Record<number, boolean> = {};
      for (const t of tasks) m[t.id] = false;
      return m;
    });

    setPhase("setup");
    setMessage("次のバトルを準備しています");
    setLastSavedMatch(null);
  };

  const setTaskRating = (taskId: number, rating: Rating) => {
    setRatings((prev) => ({ ...prev, [taskId]: rating }));
  };

  const toggleSelectTask = (taskId: number) => {
    setSelectedTaskIds((p) => ({ ...p, [taskId]: !p[taskId] }));
    // 何か選択したらエラーをクリア
    setSelectionError("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="バトル追加"
          description="バトル情報と課題評価（○△×）をまとめて記録します"
        right={
          <div className="flex items-center gap-2">
              <Link
                href="/matches"
                className="inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
              >
                バトルログへ
              </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
            >
              ホームへ
            </Link>
          </div>
        }
      />

      {phase === "setup" && (
      /* バトルフォーム */
      <Card className="p-5">
        <h2 className="text-lg font-semibold">バトル情報</h2>

        <div className="mt-4 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold">日時</label>
            <input
              type="datetime-local"
              value={form.played_at}
              onChange={(e) =>
                setForm((p) => ({ ...p, played_at: e.target.value }))
              }
              className="w-full rounded-full border bg-white px-4 py-2 text-sm"
            />
            {getFieldErrors("played_at").length > 0 ? (
              getFieldErrors("played_at").map((_, i) => (
                  <p key={i} className="mt-1 text-xs text-red-600 break-words whitespace-normal">
                  バトル日時を入力してください
                </p>
              ))
            ) : submittedOnce && !form.played_at ? (
                <p className="text-xs text-muted-foreground">
                バトル日時を入力してね（未入力でもOK運用ならこのままでもOK）
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold">ルール</label>
              <RuleSelector
                value={form.rule}
                onChange={(v) => setForm((p) => ({ ...p, rule: v }))}
                placeholder="エリア / ヤグラ…"
                className="w-full dark:text-muted-foreground"
              />
              {getFieldErrors("rule").length > 0 ? (
                getFieldErrors("rule").map((_, i) => (
                  <p key={i} className="mt-1 text-xs text-red-600 break-words whitespace-normal">
                    ルールを選択してください
                  </p>
                ))
              ) : submittedOnce && !form.rule ? (
                <p className="mt-1 text-xs text-muted-foreground">ルールを選んでね</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">ステージ</label>
              <StageSelector
                value={form.stage}
                onChange={(v) => setForm((p) => ({ ...p, stage: v }))}
                placeholder="マップ名"
                className="w-full dark:text-muted-foreground"
              />
              {getFieldErrors("stage").length > 0 ? (
                getFieldErrors("stage").map((_, i) => (
                  <p key={i} className="mt-1 text-xs text-red-600 break-words whitespace-normal">
                    ステージ名を入力してください
                  </p>
                ))
              ) : submittedOnce && !form.stage ? (
                <p className="mt-1 text-xs text-muted-foreground">ステージを入力してね</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold">モード</label>
              <ModeSelector
                value={form.mode}
                onChange={(v) => setForm((p) => ({ ...p, mode: v }))}
                placeholder="Xマッチ…"
                className="w-full"
              />
              {getFieldErrors("mode").length > 0 ? (
                getFieldErrors("mode").map((_, i) => (
                  <p key={i} className="mt-1 text-xs text-red-600 break-words whitespace-normal">
                    モードを選択してください
                  </p>
                ))
              ) : submittedOnce && !form.mode ? (
                <p className="mt-1 text-xs text-muted-foreground">モードを選んでね</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">ブキ</label>
              <WeaponSelector
                value={form.weapon}
                onChange={(v) => setForm((p) => ({ ...p, weapon: v }))}
                placeholder="スプラマニュ…"
                className="w-full"
              />
              {getFieldErrors("weapon").length > 0 ? (
                getFieldErrors("weapon").map((_, i) => (
                  <p key={i} className="mt-1 text-xs text-red-600 break-words whitespace-normal">
                    ブキを選択してください
                  </p>
                ))
              ) : submittedOnce && !form.weapon ? (
                <p className="mt-1 text-xs text-muted-foreground">ブキを選んでね</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">勝敗はバトル中に入力できます</p>
          </div>
        </div>
      </Card>
      )}

      {phase === "setup" && (
      /* 今回の課題選択（準備フェーズ） */
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold">今回の課題を選択</h2>
          <div>
            <Link
              href="/tasks"
              className="inline-flex items-center justify-center rounded-full btn px-3 py-1 text-sm font-semibold"
            >
              課題を追加
            </Link>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {loadingTasks ? (
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          ) : tasks.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">課題がまだないよ（先に課題を追加してね）</p>
            </div>
          ) : (
            tasks.map((t) => (
              <label key={t.id} className="flex items-start gap-3 rounded-2xl border bg-white p-3">
                <input
                  type="checkbox"
                  checked={!!selectedTaskIds[t.id]}
                  onChange={() => toggleSelectTask(t.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold break-words dark:text-muted-foreground">{t.title}</div>
                  {t.description ? (
                    <div className="mt-1 text-sm text-muted-foreground break-words">{t.description}</div>
                  ) : null}
                </div>
              </label>
            ))
          )}
        </div>

        {selectionError && (
          <p className="mt-2 text-sm text-red-600">{selectionError}</p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              const selectedCount = Object.values(selectedTaskIds).filter(Boolean).length;
              if (selectedCount === 0) {
                setSelectionError("課題を１つ以上選択してね！");
                return;
              }
              setPhase("battle");
            }}
            disabled={loadingTasks}
            className="inline-flex items-center justify-center rounded-full btn btn-primary px-6 text-sm font-semibold transition hover:shadow-sm disabled:opacity-50"
          >
            バトル開始
          </button>

          <button
            type="button"
            onClick={resetForm}
            disabled={loadingTasks}
            className="inline-flex items-center justify-center rounded-full btn px-6 text-sm font-semibold transition hover:shadow-sm disabled:opacity-50"
          >
            リセット
          </button>
        </div>
      </Card>
      )}

      {/* 課題評価と勝敗入力 */}
      {phase === "battle" && !lastSavedMatch && (
        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">課題評価（○△×）</h2>
            <span className="text-sm text-muted-foreground">
              選択中の数：{Object.entries(selectedTaskIds).filter(([, v]) => v).length}
            </span>
          </div>

          {/* 試合中にもステージを確認・編集できるようにする */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold">ステージ</label>
              <StageSelector
                value={form.stage}
                onChange={(v) => setForm((p) => ({ ...p, stage: v }))}
                placeholder="マップ名"
                className="w-full dark:text-muted-foreground"
              />
              {getFieldErrors("stage").length > 0 ? (
                getFieldErrors("stage").map((_, i) => (
                  <p key={i} className="mt-1 text-xs text-red-600 break-words whitespace-normal">
                    ステージ名を入力してください
                  </p>
                ))
              ) : null}
            </div>
          </div>

          {getRatingsErrors().length > 0 && (
            <div className="mt-2 text-sm text-red-600">課題の評価を入力してください</div>
          )}

          <div className="mt-4 space-y-3">
            {tasks.filter((t) => selectedTaskIds[t.id]).map((t) => (
              <div key={t.id} className="flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold break-words">{t.title}</div>
                </div>

                <div className="w-full sm:w-64 flex items-center gap-2 justify-end flex-shrink-0">
                  <div className="flex gap-2">
                    {(["○", "△", "×", "-"] as Rating[]).map((r) => {
                      const active = ratings[t.id] === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setTaskRating(t.id, r)}
                          className={`inline-flex h-12 w-12 items-center justify-center rounded-full border text-sm font-semibold transition hover:shadow-sm ${active ? "bg-slate-50" : "bg-white"}`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>

                  <RatingBadge rating={ratings[t.id] ?? "-"} />
                </div>
              </div>
            ))}
          </div>

            <div className="mt-4">
            <label className="text-sm font-semibold">コメント</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="バトルの感想やメモを入力"
              className="w-full mt-2 min-h-[80px] rounded-xl border bg-white px-4 py-2 text-sm"
            />
            {getFieldErrors("note").length > 0 && (
              getFieldErrors("note").map((_, i) => (
                <p key={i} className="mt-1 text-xs text-red-600 break-words whitespace-normal">コメントの入力が不正です</p>
              ))
            )}
          </div>

          <div className="mt-4">
            <label className="text-sm font-semibold">勝敗</label>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, is_win: true }))}
                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold border transition hover:shadow-sm ${form.is_win ? "badge-ink" : "btn"}`}
              >
                WIN
              </button>

              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, is_win: false }))}
                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold border transition hover:shadow-sm ${!form.is_win ? "badge-salmon" : "btn"}`}
              >
                LOSE
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onSubmit}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full btn btn-primary px-6 text-sm font-semibold transition hover:shadow-sm disabled:opacity-50"
            >
              {saving ? "バトルを記録中..." : "バトルを記録"}
            </button>

            <button
              type="button"
              onClick={() => setPhase("setup")}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full btn px-6 text-sm font-semibold transition hover:shadow-sm disabled:opacity-50"
            >
              戻る（編集）
            </button>
          </div>
        </Card>
      )}

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      {lastSavedMatch && (
        <div className="mt-2">
            <button
              type="button"
              onClick={gotoNextMatchKeepWeaponAndTasks}
              className="w-full sm:inline-flex items-center justify-center rounded-full btn px-4 py-3 text-sm font-semibold transition hover:shadow-sm mb-2"
            >
              そのまま次のバトルへ（ブキと課題を引き継ぐ）
            </button>
            <button
              type="button"
              onClick={gotoNextMatch}
              className="w-full sm:inline-flex items-center justify-center rounded-full btn btn-primary px-4 py-3 text-sm font-semibold transition shadow-md hover:shadow-lg"
            >
              次のバトルへ
            </button>
        </div>
      )}

      {/* デバッグ要素は本番除去 */}
    </div>
  );
}
