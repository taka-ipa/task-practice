// app/register/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api"; // ここは実際のパスに合わせてね

export default function RegisterPage() {
  const router = useRouter();

  // フォームの状態
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  // UI 用の状態
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name || !email || !password || !passwordConfirmation) {
      setErrorMessage("すべての項目を入力してね。");
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage("パスワードと確認用パスワードが一致していないよ。");
      return;
    }

    try {
      setIsSubmitting(true);

      // Laravel Breeze の /api/register に投げる想定
      await api.post("/api/register", {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      // ここでそのままログインさせてもいいけど、
      // まずはシンプルに /login に飛ばす
      router.push("/login");
    } catch (error: any) {
      console.error(error);

      // バリデーションエラーなどをざっくり表示
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("登録に失敗しました。入力内容を確認してもう一度試してね。");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
      <div className="w-full max-w-md px-6 py-8 rounded-2xl bg-slate-900/80 border border-slate-700 shadow-lg">
        <h1 className="text-2xl font-bold mb-2">新規登録</h1>
        <p className="text-sm text-slate-300 mb-6">
          アカウントを作成して、課題練習アプリを始めよう。
        </p>

        {errorMessage && (
          <div className="mb-4 text-sm text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">名前</label>
            <input
              type="text"
              className="w-full rounded-lg bg-slate-950/60 border border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">メールアドレス</label>
            <input
              type="email"
              className="w-full rounded-lg bg-slate-950/60 border border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">パスワード</label>
            <input
              type="password"
              className="w-full rounded-lg bg-slate-950/60 border border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">パスワード（確認）</label>
            <input
              type="password"
              className="w-full rounded-lg bg-slate-950/60 border border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium btn btn-primary disabled:opacity-60 disabled:cursor-not-allowed transition mt-4"
          >
            {isSubmitting ? "登録中..." : "アカウントを作成する"}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-400">
          すでにアカウントをお持ちの方は{" "}
          <a
            href="/login"
            className="text-accent hover:underline"
          >
            ログイン
          </a>
          へ。
        </p>
      </div>
    </main>
  );
}
