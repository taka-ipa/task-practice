"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        await api.get("/api/me");
        if (!mounted) return;
        router.replace("/dashboard");
      } catch (err: unknown) {
        // それ以外は通信エラーなどの可能性があるので確認しやすくログ出力しておく
        console.error("認証チェックエラー:", err);

        // 必要なら無効トークンを削除
        localStorage.removeItem("token");
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="max-w-xl w-full px-6 py-8 rounded-2xl bg-slate-900/80 border border-slate-700 shadow-lg text-center">
          <p className="text-sm text-slate-300">ログイン状態を確認中...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
      <div className="max-w-xl w-full px-6 py-8 rounded-2xl bg-slate-900/80 border border-slate-700 shadow-lg">
        <h1 className="text-2xl font-bold mb-2">
          ikaeri - 1試合ごとの課題振り返りアプリ
        </h1>

        <p className="text-sm text-slate-300 mb-6">
          1試合ごとの振り返りで、課題に○△×をつけていくアプリ。
          今はまだβ版です。
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-400 transition"
          >
            ログイン画面へ
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          ※ スマホ版は現在開発中です。
        </p>
      </div>
    </main>
  );
}