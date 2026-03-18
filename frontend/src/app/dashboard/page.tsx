"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { ResultBadge } from "@/components/ui/ResultBadge";

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
  description?: string | null;
};

type ApiTask = {
  id: number;
  title: string; // API now returns `title`
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
  modes?: {
    mode: string;
    matches: number;
    wins: number;
    losses: number;
    win_rate: number;
  }[];
};

function formatPlayedAt(playedAt: string) {
  const s = playedAt.replace(" ", "T");
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
  });
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "unauth" | "error">(
    "loading"
  );

  const [tasks, setTasks] = useState<Task[]>([]);
  // 課題評価（task_id => "○"|"△"|"×"|"-")
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

  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.post("/api/logout");
    } catch (e) {
      console.warn("logout request failed:", e);
    }

    if (typeof window !== "undefined") localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  };

  const defaultForm: MatchForm = useMemo(
    () => ({
      played_at: "",
      rule: "",
      stage: "",
      is_win: "win",
      mode: "",
      weapon: "",
    }),
    []
  );

  const [form, setForm] = useState<MatchForm>(defaultForm);

  type ApiValidationErrors = Record<string, string[]>;
  const [errors, setErrors] = useState<ApiValidationErrors>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const getFieldErrors = (field: string) => {
    return (errors && errors[field]) || [];
  };

  const fetchMatches = async () => {
    try {
      setMatchesStatus("loading");
      const res = await api.get<Paginated<Match[]>>("/api/matches", {
        params: { per_page: 5, page: 1 },
      });
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

    setSubmittedOnce(true);
    setErrors({});

    const frontErrors: ApiValidationErrors = {};
    if (!form.rule) frontErrors.rule = ["ルールを選択してください"];
    if (!form.stage) frontErrors.stage = ["ステージを選択してください"];
    if (!form.mode) frontErrors.mode = ["モードを選択してください"];
    if (!form.weapon) frontErrors.weapon = ["ブキを選択してください"];

    if (Object.keys(frontErrors).length > 0) {
      setErrors(frontErrors);
      return;
    }

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
      await api.post("/api/matches-with-ratings", payload);
      await fetchMatches();
      await fetchSummary();
      setSubmittedOnce(false);
      setErrors({});
    } catch (error) {
      console.error("failed to create match with ratings", error);
      const e: any = error;
      if (e?.response?.status === 422) {
        setErrors(e.response.data.errors ?? {});
      }
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
          title: t.title,
          description: t.description ?? null,
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
    fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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
        title="ikaeri"
        description="今日の課題を意識してイカした成長をしていこう！"
        right={
          <div className="flex flex-wrap items-center gap-2">
            {status === "ok" ? (
              <Link
                href="/matches/new"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full btn btn-primary px-4 text-sm font-semibold transition hover:shadow-sm"
              >
                ＋ バトルを追加
              </Link>
            ) : (
              <button
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full btn btn-primary px-4 text-sm font-semibold transition hover:shadow-sm disabled:opacity-50"
                disabled
                type="button"
              >
                ＋ バトルを追加
              </button>
            )}

            <Link
              href="/matches"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
            >
              バトルログへ
            </Link>

            {status === "ok" && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
              >
                ログアウト
              </button>
            )}
          </div>
        }
      />

      {/* ユーザー状態 */}
      <Card className="p-5 card--drip">
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
            {/* モード別サマリーのみを表示（直近7日合計は非表示） */}

              {/* モード別サマリー */}
              {summary.modes && summary.modes.length > 0 && (
                <div className="grid gap-4">
                  <h3 className="text-sm text-muted-foreground">モード別サマリー</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {summary.modes.map((m: any) => (
                      <Card key={m.mode} className="p-5">
                        <p className="text-sm text-muted-foreground">{m.mode || '不明'}</p>
                        <div className="mt-3 flex flex-wrap gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">バトル数</p>
                            <p className="text-2xl font-bold">{m.matches}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">勝率</p>
                            <p className="text-2xl font-bold">{m.win_rate}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">W / L</p>
                            <p className="text-2xl font-bold">{m.wins}W / {m.losses}L</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

            {todaySummary ? (
              <Card className="p-5 card--organic">
                <p className="text-sm text-muted-foreground">
                  今日（{todaySummary.date}）
                </p>
                <div className="mt-3 flex flex-wrap gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">バトル数</p>
                    <p className="text-2xl font-bold">{todaySummary.matches}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">勝率</p>
                    <p className="text-2xl font-bold">{todaySummary.win_rate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">W / L</p>
                    <p className="text-2xl font-bold">{todaySummary.wins}W / {todaySummary.losses}L</p>
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
              課題がまだないよ
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id} className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-base font-semibold">{task.title}</p>
                    {task.description && (
                      <p className="mt-2 text-sm text-muted-foreground break-words whitespace-normal">{task.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
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

      {/* 最近のバトル */}
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">最近のバトル</h2>
          </div>
            <Link
              href="/matches"
              className="text-sm font-semibold underline-offset-4 hover:underline"
            >
              バトルログを見る
            </Link>
        </div>

        {status !== "ok" ? (
              <Card className="p-6">
            <p className="text-sm text-muted-foreground">
              ログインするとバトルが見れるよ
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
              最近のバトルはまだないよ
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
    </div>
  );
}
