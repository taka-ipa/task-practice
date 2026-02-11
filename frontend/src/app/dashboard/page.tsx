"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { ResultBadge } from "@/components/ui/ResultBadge";
import { RatingBadge } from "@/components/ui/RatingBadge";
import StageSelector from "@/components/StageSelector";
import RuleSelector from "@/components/RuleSelector";
import ModeSelector from "@/components/ModeSelector";

type User = {
  id: number;
  name: string;
  email: string;
};

type Rating = "○" | "△" | "×" | "-";

type Task = {
  id: number;
  title: string;
  todayRating: Rating;
};

type ApiTask = {
  id: number;
  name: string;
  description: string | null;
  sort_order: number | null;
};

type Match = {
  id: number;
  played_at: string | null;
  mode: string | null;
  rule: string | null;
  stage: string | null;
  weapon: string | null;
  is_win: boolean | null;
};

// 汎用ページネーション型（API が { data: T, meta?:..., links?:... } を返す想定）
type Paginated<T> = {
  data: T;
  meta?: any;
  links?: any;
};

type MatchForm = {
  played_at: string; // datetime-local 用（YYYY-MM-DDTHH:mm）
  rule: string;
  stage: string;
  is_win: "win" | "lose";
  mode: string;
  weapon: string;
};

// DailySummary型
type DailySummary = {
  range: { from: string; to: string };
  totals: {
    matches: number;
    wins: number;
    losses: number;
    win_rate: number;
    ratings: { circle: number; triangle: number; cross: number };
  };
  days: {
    date: string;
    matches: number;
    wins: number;
    losses: number;
    win_rate: number;
    ratings: { circle: number; triangle: number; cross: number };
  }[];
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

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "unauth" | "error">(
    "loading"
  );

  const [tasks, setTasks] = useState<Task[]>([]);
  // 課題評価（task_id => "○"|"△"|"×"|"-"）
  const [ratings, setRatings] = useState<Record<number, Rating>>({});

  const setRating = (taskId: number, r: Rating) => {
    setRatings((prev) => ({ ...prev, [taskId]: r }));
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, todayRating: r } : t))
    );
  };

  const handleDelete = async (taskId: number) => {
    if (!confirm("課題を削除しますか？ この操作は取り消せません。")) return;
    try {
      await api.delete(`/api/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (e) {
      console.error("課題削除エラー:", e);
      alert("削除に失敗しました");
    }
  };

  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesStatus, setMatchesStatus] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");

  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [summaryStatus, setSummaryStatus] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");

  // 今日の日付（YYYY-MM-DD）※Hydration対策でuseEffect内でセット
  const [today, setToday] = useState<string>("");

  useEffect(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setToday(`${yyyy}-${mm}-${dd}`);
  }, []);

  // 試合追加モーダル
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultForm: MatchForm = useMemo(
    () => ({
      played_at: new Date().toISOString().slice(0, 16),
      rule: "",
      stage: "",
      is_win: "win",
      mode: "",
      weapon: "",
    }),
    []
  );

  const [form, setForm] = useState<MatchForm>(defaultForm);

  const openAdd = () => {
    setForm({
      ...defaultForm,
      played_at: new Date().toISOString().slice(0, 16),
    });
    setRatings({});
    setIsAddOpen(true);
  };

  const closeAdd = () => setIsAddOpen(false);

  const fetchMatches = async () => {
    if (!today) return;
    try {
      setMatchesStatus("loading");
      const res = await api.get<Paginated<Match[]>>("/api/matches", {
        params: { date: today, per_page: 5, page: 1 },
      });
      // API は paginator を返すため data を使う
      setMatches(res.data.data ?? []);
      setMatchesStatus("ok");
    } catch (e) {
      console.error("api/matches エラー:", e);
      setMatchesStatus("error");
    }
  };

  const fetchSummary = async () => {
    try {
      setSummaryStatus("loading");
      const res = await api.get<DailySummary>("/api/daily-summary");
      setSummary(res.data);
      setSummaryStatus("ok");
    } catch (e) {
      console.error("api/daily-summary エラー:", e);
      setSummaryStatus("error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const ratingsArray = Object.entries(ratings)
      .filter(([_, r]) => r !== "-")
      .map(([taskId, r]) => ({
        task_id: Number(taskId),
        rating: r as "○" | "△" | "×",
      }));

    const payload = {
      ...form,
      is_win: form.is_win === "win",
      ratings: ratingsArray,
    };

    try {
      setIsSubmitting(true);
      await api.post("/api/matches-with-ratings", payload);
      await fetchMatches();
      await fetchSummary();
      closeAdd();
    } catch (error) {
      console.error("failed to create match with ratings", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ログインユーザー取得
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get<User>("/api/user");
        setUser(res.data);
        setStatus("ok");
      } catch (error: any) {
        const statusCode = error?.response?.status;
        if (statusCode === 401) setStatus("unauth");
        else setStatus("error");
      }
    };

    fetchUser();
  }, []);

  // 課題一覧取得
  useEffect(() => {
    if (status !== "ok") return;

    const fetchTasks = async () => {
      try {
        const res = await api.get<ApiTask[]>("/api/tasks");

        const mapped: Task[] = res.data.map((t) => ({
          id: t.id,
          title: t.name,
          todayRating: "-",
        }));

        setTasks(mapped);
      } catch (e) {
        console.error("api/tasks エラー:", e);
      }
    };

    fetchTasks();
  }, [status]);

  // 今日の試合取得
  useEffect(() => {
    if (status !== "ok") return;
    if (!today) return;
    fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, today]);

  // 日別サマリー取得
  useEffect(() => {
    if (status !== "ok") return;
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const todaySummary = useMemo(() => {
    if (!summary?.days) return null;
    return summary.days.find((d) => d.date === today) ?? null;
  }, [summary, today]);

  // ------- ここから UI -------
  return (
    <div className="space-y-6">
      <PageHeader
        title="今日の課題"
        description="課題ごとに○△×で振り返り。試合もまとめて記録できます。"
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={openAdd}
              className="inline-flex items-center justify-center rounded-full btn btn-primary px-4 text-sm font-semibold transition hover:shadow-sm disabled:opacity-50"
              disabled={status !== "ok"}
              type="button"
            >
              ＋ 試合を追加
            </button>
            <Link
              href="/matches"
              className="inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
            >
              試合ログへ
            </Link>
          </div>
        }
      />

      {/* ユーザー状態 */}
      <Card className="p-5">
        {status === "loading" && (
          <p className="text-sm text-muted-foreground">ユーザー確認中...</p>
        )}

        {status === "ok" && user && (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">ログイン中</p>
              <p className="text-base font-semibold">こんにちは、{user.name} さん</p>
            </div>
            <div className="text-sm text-muted-foreground">今日：{today || "-"}</div>
          </div>
        )}

        {status === "unauth" && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              未ログインです。ログインすると記録できます。
            </p>
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-full border bg-white px-4 text-sm font-semibold transition hover:shadow-sm"
            >
              /loginへ
            </Link>
          </div>
        )}

        {status === "error" && (
          <p className="text-sm text-muted-foreground">
            ユーザー情報の取得でエラーが出てるかも…（コンソール見てね）
          </p>
        )}
      </Card>

      {/* 直近7日サマリー */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">直近7日サマリー</h2>

        {status !== "ok" ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              ログインするとサマリーが見れるよ
            </p>
          </Card>
        ) : summaryStatus === "loading" ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          </Card>
        ) : summaryStatus === "error" ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              /api/daily-summary の取得でエラーが出たかも（コンソール見てね）
            </p>
          </Card>
        ) : !summary ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">サマリーがまだないよ</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">
                {summary.range.from} 〜 {summary.range.to}
              </p>

              <div className="mt-3 flex flex-wrap gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">試合数</p>
                  <p className="text-2xl font-bold">{summary.totals.matches}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">勝率</p>
                  <p className="text-2xl font-bold">{summary.totals.win_rate}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">○ / △ / ×</p>
                  <p className="text-2xl font-bold">
                    {summary.totals.ratings.circle} / {summary.totals.ratings.triangle} /{" "}
                    {summary.totals.ratings.cross}
                  </p>
                </div>
              </div>
            </Card>

            {todaySummary ? (
              <Card className="p-5">
                <p className="text-sm text-muted-foreground">
                  今日（{todaySummary.date}）
                </p>
                <div className="mt-3 flex flex-wrap gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">試合数</p>
                    <p className="text-2xl font-bold">{todaySummary.matches}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">勝率</p>
                    <p className="text-2xl font-bold">{todaySummary.win_rate}%</p>
                  </div>
                </div>
              </Card>
            ) : null}
          </div>
        )}
      </div>

      {/* 課題 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">課題</h2>
          <Link
            href="/tasks"
            className="inline-flex items-center justify-center rounded-full btn px-3 py-1 text-sm font-semibold transition hover:shadow-sm"
          >
            課題を追加・編集
          </Link>
        </div>

        {tasks.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              課題がまだないよ（/api/tasks が空だった）
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id} className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-base font-semibold">{task.title}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">今日の評価</span>
                      <RatingBadge rating={task.todayRating} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRating(task.id, "○")}
                      className="inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
                    >
                      ○
                    </button>
                    <button
                      type="button"
                      onClick={() => setRating(task.id, "△")}
                      className="inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
                    >
                      △
                    </button>
                    <button
                      type="button"
                      onClick={() => setRating(task.id, "×")}
                      className="inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
                    >
                      ×
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(task.id)}
                      className="inline-flex items-center justify-center rounded-full btn btn-danger px-3 text-sm font-semibold transition"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 今日の試合 */}
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">今日の試合</h2>
            <p className="text-sm text-muted-foreground">（{today || "-"}）</p>
          </div>
          <Link
            href="/matches"
            className="text-sm font-semibold underline-offset-4 hover:underline"
          >
            試合ログを見る
          </Link>
        </div>

        {status !== "ok" ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              ログインすると試合が見れるよ
            </p>
          </Card>
        ) : matchesStatus === "loading" ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          </Card>
        ) : matchesStatus === "error" ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              /api/matches の取得でエラーが出たかも（コンソール見てね）
            </p>
          </Card>
        ) : matches.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              今日の試合はまだないよ
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {matches.map((m) => (
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
                        {m.played_at ? ` · ${formatPlayedAt(m.played_at)}` : ""}
                      </p>
                    </div>

                    <span className="text-sm text-muted-foreground">›</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* モーダル */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={closeAdd} />

          <div className="absolute inset-0 flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-xl rounded-2xl border bg-white p-5 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">試合を追加</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    試合情報と課題評価（○△×）をまとめて記録します
                  </p>
                </div>
                <button
                  onClick={closeAdd}
                  className="inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
                  type="button"
                >
                  閉じる
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold">勝敗</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, is_win: "win" }))}
                      className={`flex-1 rounded-full border px-4 py-2 text-sm font-semibold transition hover:shadow-sm ${
                        form.is_win === "win" ? "badge-ink" : "btn"
                      }`}
                    >
                      WIN
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, is_win: "lose" }))}
                      className={`flex-1 rounded-full border px-4 py-2 text-sm font-semibold transition hover:shadow-sm ${
                        form.is_win === "lose" ? "badge-salmon" : "btn"
                      }`}
                    >
                      LOSE
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold">ルール（任意）</label>
                    <RuleSelector
                      value={form.rule}
                      onChange={(v) => setForm((p) => ({ ...p, rule: v }))}
                      placeholder="エリア / ヤグラ…"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-semibold">ステージ（任意）</label>
                    <StageSelector
                      value={form.stage}
                      onChange={(v) => setForm((p) => ({ ...p, stage: v }))}
                      placeholder="ネギトロ…"
                      className="w-full"
                    />
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
                    <input
                      value={form.weapon}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, weapon: e.target.value }))
                      }
                      placeholder="スプラマニュ…"
                      className="w-full rounded-full border bg-white px-4 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <p className="text-sm font-semibold">この試合の課題評価</p>

                  {tasks.length === 0 ? (
                    <div className="rounded-2xl border bg-white p-4">
                      <p className="text-sm text-muted-foreground">
                        課題がまだないよ（先に課題を追加してね）
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between rounded-2xl border bg-white p-3"
                        >
                          <p className="text-sm font-semibold">{task.title}</p>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setRating(task.id, "○")}
                              className="inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
                            >
                              ○
                            </button>
                            <button
                              type="button"
                              onClick={() => setRating(task.id, "△")}
                              className="inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
                            >
                              △
                            </button>
                            <button
                              type="button"
                              onClick={() => setRating(task.id, "×")}
                              className="inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
                            >
                              ×
                            </button>
                            <RatingBadge rating={ratings[task.id] ?? "-"} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={closeAdd}
                    className="flex-1 inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
                    disabled={isSubmitting}
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="flex-1 inline-flex items-center justify-center rounded-full btn btn-primary px-4 text-sm font-semibold transition hover:shadow-sm disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "試合を記録中..." : "試合を記録"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
