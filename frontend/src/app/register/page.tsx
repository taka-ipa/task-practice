// app/register/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api"; // ここは実際のパスに合わせてね

export default function RegisterPage() {
  const router = useRouter();

  // フォームの状態
  const [name, setName] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  // UI 用の状態
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name || !loginId || !password || !passwordConfirmation) {
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
        login_id: loginId,
        password,
        password_confirmation: passwordConfirmation,
      });

      // ここでそのままログインさせてもいいけど、
      // まずはシンプルに /login に飛ばす
      router.push("/login");
    } catch (error: any) {
      console.error(error);

      // API のバリデーションエラーを日本語化して表示
      const resp = error.response?.data;
      if (resp?.errors) {
        // login_id 用のエラーがあれば優先表示
        const loginErr = resp.errors.login_id || resp.errors.loginId || null;
        if (Array.isArray(loginErr) && loginErr.length > 0) {
          const msg = loginErr[0];
          if (typeof msg === 'string' && (msg.includes('already been taken') || msg.includes('has already been taken'))) {
            setErrorMessage('そのユーザーIDは既に使用されています。別のIDを選んでください。');
          } else {
            setErrorMessage(String(msg));
          }
          return;
        }
        // その他フィールドのエラーがあれば先頭を表示
        const firstField = Object.keys(resp.errors)[0];
        if (firstField) {
          const fieldMsg = resp.errors[firstField];
          if (Array.isArray(fieldMsg) && fieldMsg.length > 0) {
            setErrorMessage(String(fieldMsg[0]));
            return;
          }
        }
      }

      if (resp?.message) {
        // 既定の英語メッセージを日本語へ置換
        const m: string = String(resp.message);
        if (m.includes('The login id has already been taken') || m.includes('login id has already been taken')) {
          setErrorMessage('そのユーザーIDは既に使用されています。別のIDを選んでください。');
        } else {
          setErrorMessage(m);
        }
      } else {
        setErrorMessage('登録に失敗しました。入力内容を確認してもう一度試してね。');
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
            <label className="block text-sm mb-1">ユーザーID</label>
            <input
              type="text"
              className="w-full rounded-lg bg-slate-950/60 border border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              autoComplete="username"
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
