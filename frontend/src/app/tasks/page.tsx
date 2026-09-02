"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

type ApiTask = {
  id: number;
  title: string; // API will return title after migration
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const confirm = useConfirm();
  const { showToast } = useToast();


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

  const startEdit = (t: ApiTask) => {
    setEditingId(t.id);
    setEditTitle(t.title ?? "");
    setEditDescription(t.description ?? "");
    setFormError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setFormError(null);
  };

  const handleUpdate = async (taskId: number) => {
    if (!editTitle.trim()) return setFormError("タイトルは必須だよ！");
    try {
      setSubmitting(true);
      await api.put(`/api/tasks/${taskId}`, {
        title: editTitle.trim(),
        description: editDescription.trim() ? editDescription.trim() : null,
      });

      setTasks((prev) => prev.map((p) => (p.id === taskId ? { ...p, title: editTitle.trim(), description: editDescription.trim() || null } : p)));
      cancelEdit();
    } catch (e: any) {
      console.error("PUT /api/tasks/:id エラー:", e);
      setFormError(e?.response?.data?.message || "更新に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (taskId: number) => {
    const ok = await confirm("課題を削除しますか？ この操作は取り消せません。");
    if (!ok) return;
    try {
      await api.delete(`/api/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (e) {
      console.error("DELETE /api/tasks/:id エラー:", e);
      showToast("削除に失敗しました");
    }
  };


  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="課題一覧"
        description="今回のバトルで意識する課題を作成・編集できます"
        right={
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
            >
              ホームへ
            </Link>
            <Link
              href="/matches/new"
              className="inline-flex items-center justify-center rounded-full btn btn-primary px-4 text-sm font-semibold transition hover:shadow-sm"
            >
              ＋ バトル追加
            </Link>
          </div>
        }
      />

      <Card className="p-5">
        <h2 className="text-lg font-semibold">課題を追加</h2>

        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold">課題タイトル（必須）</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-full border bg-white px-4 py-2 text-sm dark:text-[var(--ink)]"
              placeholder="例：初弾精度"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold">説明（任意）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[80px] rounded-xl border bg-white px-4 py-2 text-sm dark:text-[var(--ink)]"
              placeholder="例：最初の1発を丁寧に当てる"
            />
          </div>

          {formError && !editingId && (
            <p className="text-xs text-red-600 break-words whitespace-normal">{formError}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full btn btn-primary px-4 text-sm font-semibold transition hover:shadow-sm disabled:opacity-50"
            >
              {submitting ? "追加中..." : "追加"}
            </button>

            <p className="text-sm text-muted-foreground">
              追加したら一覧が更新されるよ
            </p>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {status === "loading" && (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          </Card>
        )}

        {status === "error" && (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">課題取得に失敗したかも…</p>
          </Card>
        )}

        {status === "ok" && tasks.length === 0 && (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">課題がまだないよ</p>
          </Card>
        )}

        {tasks.map((t) => (
          <Card key={t.id} className="p-5">
            {editingId === t.id ? (
              <div className="space-y-3">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-full border bg-white px-4 py-2 text-sm dark:text-[var(--ink)]"
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full min-h-[60px] rounded-xl border bg-white px-4 py-2 text-sm dark:text-[var(--ink)]"
                />
                {formError && (
                  <p className="text-xs text-red-600 break-words whitespace-normal">{formError}</p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdate(t.id)}
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-full btn btn-primary px-4 text-sm font-semibold transition hover:shadow-sm disabled:opacity-50"
                  >
                    保存
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="inline-flex items-center justify-center rounded-full btn px-4 text-sm font-semibold transition hover:shadow-sm"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-base font-semibold break-words whitespace-normal">{t.title}</p>
                  {t.description && (
                    <p className="mt-2 text-sm text-muted-foreground break-words whitespace-normal">{t.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(t)}
                    className="inline-flex items-center justify-center rounded-full btn btn-info px-3 text-sm font-semibold transition"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="inline-flex items-center justify-center rounded-full btn btn-danger px-3 text-sm font-semibold transition"
                  >
                    削除
                  </button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
