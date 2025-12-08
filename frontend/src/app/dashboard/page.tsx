// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get<User>("/api/user");
        setUser(res.data);
        setStatus("ok");
        console.log("ログイン中ユーザー:", res.data);
      } catch (error: any) {
        const statusCode = error?.response?.status;
        console.log("api/user エラー:", statusCode, error?.response?.data);

        if (statusCode === 401) {
          setStatus("unauth");
        } else {
          setStatus("error");
        }
      }
    };

    fetchUser();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* ヘッダー */}
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">
              課題練習アプリ（仮）
            </p>
            <h1 className="text-2xl font-bold">今日の課題</h1>
            <p className="text-xs text-slate-400 mt-1">
              ※ 今はモックデータ（あとでAPIにつなぐ）
            </p>
          </div>

          {/* こんにちは！◯◯さん */}
          <div className="text-right text-sm">
            {status === "loading" && (
              <p className="text-slate-400 text-xs">ユーザー確認中...</p>
            )}

            {status === "ok" && user && (
              <>
                <p className="text-xs text-slate-400">ログイン中のユーザー</p>
                <p className="font-semibold">
                  こんにちは、{user.name} さん
                </p>
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

        {/* モックの課題カード一覧 */}
        <div className="grid gap-3 mt-4">
          {mockTasks.map((task) => (
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
          ))}
        </div>
      </div>
    </main>
  );
}
