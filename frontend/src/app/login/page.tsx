"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();

  // テストしやすい初期値（必要なら空にしてOK）
  const [email, setEmail] = useState("test_register@example.com");
  const [password, setPassword] = useState("password123");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await api.post("/api/login", { email, password });

      if (typeof window !== "undefined") {
        localStorage.setItem("token", res.data.token);
      }

      // ダッシュボードへ（今 "/" がdashboardならそのままでOK）
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error(err);
      setError("メールアドレスかパスワードが違うか、ログインに失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="ログイン"
        description="登録済みのメールアドレスとパスワードを入力してね。"
        right={
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-full border bg-white px-4 text-sm font-semibold transition hover:shadow-sm"
          >
            ホームへ
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-md">
        <Card className="p-6">
          {error && (
            <div className="mb-4 rounded-2xl border bg-white p-4">
              <p className="text-sm font-semibold">ログインできませんでした</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold" htmlFor="email">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                className="w-full rounded-full border bg-white px-4 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold" htmlFor="password">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                className="w-full rounded-full border bg-white px-4 py-2 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 w-full items-center justify-center rounded-full border bg-white px-4 text-sm font-semibold transition hover:shadow-sm disabled:opacity-50"
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/register"
                className="text-sm font-semibold underline-offset-4 hover:underline"
              >
                アカウント作成へ
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
