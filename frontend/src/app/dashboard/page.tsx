"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";

type User = {
  id: number;
  name: string;
  email: string;
};

type Task = {
  id: number;
  title: string;
  todayRating: "○" | "△" | "×" | "-";
};

type ApiTask = {
  id: number;
  title: string;
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

type MatchForm = {
  played_at: string; // datetime-local 用（YYYY-MM-DDTHH:mm）
  rule: string;
  stage: string;
  is_win: "win" | "lose";
  mode: string;
  weapon: string;
};

// ✅ 追加：DailySummary型
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

const mockTasks: Task[] = [
  { id: 1, title: "初弾精度", todayRating: "○" },
  { id: 2, title: "デス後の立ち位置", todayRating: "△" },
  { id: 3, title: "打開の入り方", todayRating: "×" },
];

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "unauth" | "error">(
    "loading"
  );

  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesStatus, setMatchesStatus] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");

  // ✅ 追加：daily-summary state
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [summaryStatus, setSummaryStatus] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");

  // 今日の日付（YYYY-MM-DD）
  const today = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // 試合追加モーダル
  const [isAddOpen, setIsAddOpen] = useState(false);

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
    setIsAddOpen(true);
  };

  const closeAdd = () => setIsAddOpen(false);

  const fetchMatches = async () => {
    try {
      setMatchesStatus("loading");
      const res = await api.get<Match[]>("/api/matches", {
        params: { date: today },
      });
      setMatches(res.data);
      setMatchesStatus("ok");
    } catch (e) {
      console.error("api/matches エラー:", e);
      setMatchesStatus("error");
    }
  };

  // ✅ 追加：daily-summary取得関数（試合追加後に再取得したいので関数化）
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

    const payload = {
      ...form,
      is_win: form.is_win === "win",
    };

    try {
      await api.post("/api/matches", payload);
      await fetchMatches(); // 今日の試合一覧を再取得
      await fetchSummary(); // ✅ 追加：サマリーも更新
      closeAdd(); // 成功したら閉じる
    } catch (error) {
      console.error("failed to create match", error);
      // 余裕あればここでエラー表示
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

    const run = async () => {
      await fetchMatches();
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, today]);

  // ✅ 追加：日別サマリー取得（ログイン後に一回）
  useEffect(() => {
    if (status !== "ok") return;

    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const todaySummary = summary?.days?.[summary.days.length - 1] ?? null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* ヘッダー */}
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">課題練習アプリ（仮）</p>
            <h1 className="text-2xl font-bold">今日の課題</h1>
            <p className="text-xs text-slate-400 mt-1">
              ※ 課題は /api/tasks から取得（評価はまだ仮）
            </p>

            <button
              onClick={openAdd}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-sky-500/80 hover:bg-sky-400 px-3 py-2 text-sm font-medium"
            >
              ＋ 試合を追加
            </button>
          </div>

          <div className="text-right text-sm">
            {status === "loading" && (
              <p className="text-slate-400 text-xs">ユーザー確認中...</p>
            )}

            {status === "ok" && user && (
              <>
                <p className="text-xs text-slate-400">ログイン中のユーザー</p>
                <p className="font-semibold">こんにちは、{user.name} さん</p>
              </>
            )}

            {status === "unauth" && (
              <p className="text-xs text-rose-400">
                未ログインです。/login からログインしてね。
              </p>
            )}

            {status === "error" && (
              <p className="text-xs text-amber-400">
                ユーザー情報の取得でエラーが出てるかも…。
              </p>
            )}
          </div>
        </header>

        {/* ✅ 追加：直近7日サマリー */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">直近7日サマリー</h2>

          {status !== "ok" ? (
            <div className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3 text-sm text-slate-400">
              ログインするとサマリーが見れるよ
            </div>
          ) : summaryStatus === "loading" ? (
            <div className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3 text-sm text-slate-400">
              読み込み中...
            </div>
          ) : summaryStatus === "error" ? (
            <div className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3 text-sm text-rose-300">
              /api/daily-summary の取得でエラーが出たかも（コンソール見てね）
            </div>
          ) : !summary ? (
            <div className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3 text-sm text-slate-400">
              サマリーがまだないよ
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3">
                <p className="text-xs text-slate-400">
                  {summary.range.from} 〜 {summary.range.to}
                </p>

                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">試合数</p>
                    <p className="text-lg font-bold">{summary.totals.matches}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">勝率</p>
                    <p className="text-lg font-bold">{summary.totals.win_rate}%</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">○ / △ / ×</p>
                    <p className="text-lg font-bold">
                      {summary.totals.ratings.circle} / {summary.totals.ratings.triangle} /{" "}
                      {summary.totals.ratings.cross}
                    </p>
                  </div>
                </div>
              </div>

              {todaySummary && (
                <div className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3">
                  <p className="text-xs text-slate-400">今日（{todaySummary.date}）</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">試合数</p>
                      <p className="text-lg font-bold">{todaySummary.matches}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">勝率</p>
                      <p className="text-lg font-bold">{todaySummary.win_rate}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 課題 */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">課題</h2>

          <div className="grid gap-3">
            {tasks.length === 0 ? (
              <div className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3 text-sm text-slate-400">
                課題がまだないよ（/api/tasks が空だった）
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-slate-400">
                      今日の評価：{task.todayRating}
                    </p>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <button className="px-3 py-1 rounded-lg bg-emerald-500/80 hover:bg-emerald-400">
                      ○
                    </button>
                    <button className="px-3 py-1 rounded-lg bg-amber-500/80 hover:bg-amber-400">
                      △
                    </button>
                    <button className="px-3 py-1 rounded-lg bg-rose-500/80 hover:bg-rose-400">
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 今日の試合 */}
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">今日の試合</h2>
            <p className="text-xs text-slate-400">({today})</p>
          </div>

          {status !== "ok" ? (
            <div className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3 text-sm text-slate-400">
              ログインすると試合が見れるよ
            </div>
          ) : matchesStatus === "loading" ? (
            <div className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3 text-sm text-slate-400">
              読み込み中...
            </div>
          ) : matchesStatus === "error" ? (
            <div className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3 text-sm text-rose-300">
              /api/matches の取得でエラーが出たかも（コンソール見てね）
            </div>
          ) : matches.length === 0 ? (
            <div className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3 text-sm text-slate-400">
              今日の試合はまだないよ
            </div>
          ) : (
            <div className="grid gap-3">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {m.rule ?? "-"} / {m.stage ?? "-"}
                    </p>
                    <p className="text-xs">
                      {m.is_win === null ? "-" : m.is_win ? "WIN" : "LOSE"}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {m.mode ?? "-"} / {m.weapon ?? "-"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* モーダル */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={closeAdd} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">試合を追加</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    ※ まずはUIだけ（次でAPIにつなぐ）
                  </p>
                </div>
                <button
                  onClick={closeAdd}
                  className="rounded-lg px-3 py-1 text-sm bg-slate-800 hover:bg-slate-700"
                >
                  閉じる
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">日時</label>
                  <input
                    type="datetime-local"
                    value={form.played_at}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, played_at: e.target.value }))
                    }
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300">勝敗</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, is_win: "win" }))}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm border ${
                        form.is_win === "win"
                          ? "bg-emerald-500/80 border-emerald-400"
                          : "bg-slate-950 border-slate-700 hover:bg-slate-800"
                      }`}
                    >
                      WIN
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, is_win: "lose" }))}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm border ${
                        form.is_win === "lose"
                          ? "bg-rose-500/80 border-rose-400"
                          : "bg-slate-950 border-slate-700 hover:bg-slate-800"
                      }`}
                    >
                      LOSE
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300">ルール（任意）</label>
                    <input
                      value={form.rule}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, rule: e.target.value }))
                      }
                      placeholder="エリア / ヤグラ…"
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300">ステージ（任意）</label>
                    <input
                      value={form.stage}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, stage: e.target.value }))
                      }
                      placeholder="ネギトロ…"
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300">モード（任意）</label>
                    <input
                      value={form.mode}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, mode: e.target.value }))
                      }
                      placeholder="Xマッチ…"
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300">ブキ（任意）</label>
                    <input
                      value={form.weapon}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, weapon: e.target.value }))
                      }
                      placeholder="スプラマニュ…"
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={closeAdd}
                    className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2 text-sm"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-sky-500/80 hover:bg-sky-400 px-3 py-2 text-sm font-medium"
                  >
                    保存（仮）
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
