export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
      <div className="w-full max-w-md px-6 py-8 rounded-2xl bg-slate-900/80 border border-slate-700 shadow-lg">
        <h1 className="text-xl font-bold mb-4">ログイン</h1>

        <form className="space-y-4">
          <div>
            <label className="block text-sm mb-1">メールアドレス</label>
            <input
              type="email"
              className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="you@google.com"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">パスワード</label>
            <input
              type="password"
              className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="button"
            className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 transition px-3 py-2 text-sm font-medium"
          >
            ログイン（まだダミー）
          </button>
        </form>
      </div>
    </main>
  );
}
