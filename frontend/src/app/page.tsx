import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
      <div className="max-w-xl w-full px-6 py-8 rounded-2xl bg-slate-900/80 border border-slate-700 shadow-lg">
        <h1 className="text-2xl font-bold mb-2">
          課題練習アプリ（仮）
        </h1>
        <p className="text-sm text-slate-300 mb-6">
          1日ごとの振り返りで、課題に○△×をつけていくアプリ。
          今はまだβ版です。
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-400 transition"
          >
            ログイン画面へ
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium border border-slate-600 hover:bg-slate-800 transition"
          >
            ダッシュボードへ
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          ※ バックエンド（Laravel）とはまだ未接続です。
        </p>
      </div>
    </main>
  );
}
