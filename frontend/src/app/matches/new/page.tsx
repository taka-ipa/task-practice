"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { RatingBadge } from "@/components/ui/RatingBadge";

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
        const list: Task[] = res.data?.data ?? res.data; // dataラップどっちでも耐える
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
            {submittedOnce && !form.played_at && !errors.played_at && (
              <p className="text-xs text-muted-foreground">
                試合日時を入力してね（未入力でもOK運用ならこのままでもOK）
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold">ルール</label>
              <input
                value={form.rule}
                onChange={(e) =>
                  setForm((p) => ({ ...p, rule: e.target.value }))
                }
                className="w-full rounded-full border bg-white px-4 py-2 text-sm"
                placeholder="エリア / ヤグラ…"
              />
              {submittedOnce && !form.rule && !errors.rule && (
                <p className="mt-1 text-xs text-muted-foreground">
                  ルールを入力してね
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">ステージ</label>
              <input
                value={form.stage}
                onChange={(e) =>
                  setForm((p) => ({ ...p, stage: e.target.value }))
                }
                className="w-full rounded-full border bg-white px-4 py-2 text-sm"
                placeholder="マップ名"
              />
              {submittedOnce && !form.stage && !errors.stage && (
                <p className="mt-1 text-xs text-muted-foreground">
                  ステージを入力してね
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold">モード（任意）</label>
              <input
                value={form.mode}
                onChange={(e) =>
                  setForm((p) => ({ ...p, mode: e.target.value }))
                }
                className="w-full rounded-full border bg-white px-4 py-2 text-sm"
                placeholder="Xマッチ…"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">ブキ（任意）</label>
              <input
                value={form.weapon}
                onChange={(e) =>
                  setForm((p) => ({ ...p, weapon: e.target.value }))
                }
                className="w-full rounded-full border bg-white px-4 py-2 text-sm"
                placeholder="スプラマニュ…"
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
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="font-semibold">{t.title}</div>
                  {t.description ? (
                    <div className="mt-1 text-sm text-muted-foreground">
                      {t.description}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
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
