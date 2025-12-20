"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

type ApiTask = {
  id: number;
  title: string;
  description: string | null;
  sort_order: number | null;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);


  const fetchTasks = async () => {
    try {
      setStatus("loading");
      const res = await api.get<ApiTask[]>("/api/tasks");
      setTasks(res.data);
      setStatus("ok");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
  e.preventDefault();
  setFormError(null);

    if (!title.trim()) {
      setFormError("タイトルは必須だよ！");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/api/tasks", {
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
      });

      // 入力クリア
      setTitle("");
      setDescription("");

      // 一覧更新
      await fetchTasks();
    } catch (error: any) {
      console.error("POST /api/tasks エラー:", error);
      const msg =
        error?.response?.data?.message ||
        "作成に失敗したかも…（API側のバリデーション確認してね）";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };


  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">課題一覧</h1>
          <Link className="text-sm text-slate-300 hover:underline" href="/dashboard">
            ← dashboard
          </Link>
        </header>

        <form
          onSubmit={handleCreate}
          className="rounded-xl bg-slate-900/80 border border-slate-700 p-4 space-y-3"
        >
          <div>
            <label className="text-xs text-slate-400">課題タイトル（必須）</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
              placeholder="例：初弾精度"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">説明（任意）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm min-h-[80px]"
              placeholder="例：最初の1発を丁寧に当てる"
            />
          </div>

          {formError && <p className="text-xs text-rose-400">{formError}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-400 disabled:opacity-50 text-sm font-medium"
            >
              {submitting ? "追加中..." : "追加"}
            </button>

            <p className="text-xs text-slate-400">
              追加したら一覧が更新されるよ
            </p>
          </div>
        </form>

        {status === "loading" && (
          <p className="text-slate-400 text-sm">読み込み中...</p>
        )}

        {status === "error" && (
          <p className="text-amber-400 text-sm">課題取得に失敗したかも…</p>
        )}

        {status === "ok" && tasks.length === 0 && (
          <div className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3 text-sm text-slate-400">
            課題がまだないよ
          </div>
        )}

        {tasks.map((t) => (
          <div
            key={t.id}
            className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3"
          >
            <p className="text-sm font-medium">{t.title}</p>
            {t.description && (
              <p className="text-xs text-slate-400 mt-1">{t.description}</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
