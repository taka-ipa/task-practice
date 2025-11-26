"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("test_register@example.com"); // テストしやすいように初期値入れとく
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post("/api/login", {
        email,
        password,
      });

      // トークンを保存（axiosのinterceptorで使うやつ）
      if (typeof window !== "undefined") {
        localStorage.setItem("token", res.data.token);
      }

      // とりあえずトップに戻す or ダッシュボードへ
      router.push("/");
    } catch (err: unknown) {
      console.error(err);
      // エラーメッセージざっくり出す（細かいのは後で整えればOK）
      setError("メールアドレスかパスワードが違うか、ログインに失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-700 rounded-2xl px-6 py-8 shadow-lg">
        <h1 className="text-xl font-bold mb-2">ログイン</h1>
        <p className="text-sm text-slate-300 mb-6">
          登録済みのメールアドレスとパスワードを入力してね。
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-950/40 border border-red-700/60 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="email">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-lg bg-slate-950 border border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1" htmlFor="password">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-lg bg-slate-950 border border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>
    </main>
  );
}
