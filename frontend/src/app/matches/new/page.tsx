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
  });

  // ratings を Record で持つ
  const [ratings, setRatings] = useState<Record<number, Rating>>({});

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [errors, setErrors] = useState<ApiValidationErrors>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoadingTasks(true);
        const res = await api.get("/api/tasks");
        const raw: any[] = res.data?.data ?? res.data; // dataラップどっちでも耐える

        // API は `title` を返す前提で正規化
        const list: Task[] = (raw ?? []).map((it) => ({
          id: it.id,
          title: it.title ?? "",
          description: it.description ?? null,
          sort_order: it.sort_order ?? null,
        }));

        setTasks(list);

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

  const taskIndexMap = useMemo(() => {
    const map: Record<number, number> = {};
    ratingArray.forEach((r, i) => {
      map[r.task_id] = i;
    });
    return map;
  }, [ratingArray]);

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
    });

    // tasks は残ってるので、ratings を "-" に戻す
    setRatings(() => {
      const next: Record<number, Rating> = {};
      for (const t of tasks) next[t.id] = "-";
      return next;
    });

    setSubmittedOnce(false);
    setErrors({});
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
        ratings: ratingArray,
      };

      await api.post("/api/matches-with-ratings", payload);
      setMessage("試合を記録しました ✅");
      resetForm();
    } catch (e: any) {
      console.error(e);
      if (e?.response?.status === 422) {
        const apiErrors = e?.response?.data?.errors;
        setErrors(apiErrors ?? {});
        setMessage("入力内容を確認してください");
      } else {
        setMessage("試合の記録に失敗しました");
      }
    } finally {
      setSaving(false);
    }
  };

  const setTaskRating = (taskId: number, rating: Rating) => {
    setRatings((prev) => ({ ...prev, [taskId]: rating }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="試合追加"
        description="試合情報と課題評価（○△×）をまとめて記録します"
        right={
          <div className="flex items-center gap-2">
            <Link
              href="/matches"
              className="inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
            >
              試合ログへ
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

      {/* 試合フォーム */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold">試合情報</h2>

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
              // API のメッセージは言語が混在する可能性があるため、日本語の定型文を表示
              getFieldErrors("played_at").map((_, i) => (
                <p key={i} className="mt-1 text-xs text-red-600 break-words whitespace-normal">
                  試合日時を入力してください
                </p>
              ))
            ) : submittedOnce && !form.played_at ? (
              <p className="text-xs text-muted-foreground">
                試合日時を入力してね（未入力でもOK運用ならこのままでもOK）
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
                className="w-full"
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
                className="w-full"
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
              <label className="text-sm font-semibold">モード（任意）</label>
              <ModeSelector
                value={form.mode}
                onChange={(v) => setForm((p) => ({ ...p, mode: v }))}
                placeholder="Xマッチ…"
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">ブキ（任意）</label>
              <WeaponSelector
                value={form.weapon}
                onChange={(v) => setForm((p) => ({ ...p, weapon: v }))}
                placeholder="スプラマニュ…"
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold">勝敗</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, is_win: true }))}
                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold border transition hover:shadow-sm ${
                  form.is_win ? "badge-ink" : "btn"
                }`}
              >
                WIN
              </button>

              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, is_win: false }))}
                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold border transition hover:shadow-sm ${
                  !form.is_win ? "badge-salmon" : "btn"
                }`}
              >
                LOSE
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* 課題評価 */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">課題評価（○△×）</h2>
          <span className="text-sm text-muted-foreground">
            選択中の数：{Object.values(ratings).filter((r) => r !== "-").length}
          </span>
        </div>

        {loadingTasks ? (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              課題がまだないよ（先に課題を追加してね）
            </p>
            <div className="mt-2">
              <Link
                href="/tasks"
                className="inline-flex items-center rounded-full btn px-3 py-1 text-sm font-semibold transition hover:shadow-sm"
              >
                課題ページへ（追加・編集）
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {getRatingsErrors().length > 0 && (
              <div className="text-sm text-red-600 break-words whitespace-normal">
                {getRatingsErrors().map((_, i) => (
                  <div key={i} className="mt-1 max-w-full break-words whitespace-normal">課題の評価を入力してください</div>
                ))}
              </div>
            )}
            {tasks.map((t) => (
              <div
                key={t.id}
                className="flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1 min-w-0">
                    <div className="font-semibold break-words">{t.title}</div>
                    {t.description ? (
                      <div className="mt-1 text-sm text-muted-foreground break-words">
                        {t.description}
                      </div>
                    ) : null}
                    {(() => {
                      const idx = taskIndexMap[t.id];
                      const msgs =
                        getFieldErrors(`ratings.${idx}.rating`) || getFieldErrors(`ratings.${idx}`) || [];
                      if (msgs.length > 0) {
                        return (
                          <div className="mt-2">
                            {msgs.map((_, i) => (
                              <p key={i} className="text-xs text-red-600 break-words whitespace-normal">
                                評価を選択してください
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}
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
                          className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold transition hover:shadow-sm ${
                            active ? "bg-slate-50" : "bg-white"
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>

                  <RatingBadge rating={ratings[t.id] ?? "-"} />
                </div>
                {/* per-task errors are rendered above (title/description area) */}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 保存エリア */}
      <div className="space-y-3">
        {Object.keys(errors).length > 0 && (
          <Card className="p-5">
            <p className="font-semibold">入力エラーがあります</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
              {Object.entries(errors).flatMap(([field, msgs]) =>
                (msgs ?? []).map((m, i) => (
                  <li key={`${field}-${i}`}>
                    {field === "played_at"
                      ? `played_at: ${m}`
                      : field === "rule"
                      ? `rule: ${m}`
                      : field === "stage"
                      ? `stage: ${m}`
                      : field === "is_win"
                      ? `is_win: ${m}`
                      : field === "ratings"
                      ? `ratings: ${m}`
                      : `${field}: ${m}`}
                  </li>
                ))
              )}
            </ul>
          </Card>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving || loadingTasks}
            className="inline-flex items-center justify-center rounded-full btn btn-primary px-6 text-sm font-semibold transition hover:shadow-sm disabled:opacity-50"
          >
            {saving ? "試合を記録中..." : "試合を記録"}
          </button>

          <button
            type="button"
            onClick={resetForm}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-full btn px-6 text-sm font-semibold transition hover:shadow-sm disabled:opacity-50"
          >
            リセット
          </button>

          <Link
            href="/matches"
            className="inline-flex items-center justify-center rounded-full btn px-6 text-sm font-semibold transition hover:shadow-sm"
          >
            試合ログへ戻る
          </Link>
        </div>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>

      {/* デバッグ（残すならCardで統一） */}
      <Card className="p-5">
        <button
          type="button"
          onClick={async () => {
            const res = await api.get("/api/matches");
            console.log("matches:", res.data);
            alert("consoleに出したよ！");
          }}
          className="inline-flex items-center justify-center rounded-full btn px-6 text-sm font-semibold transition hover:shadow-sm"
        >
          （デバッグ）試合ログを取得してconsole表示
        </button>
      </Card>
    </div>
  );
}
