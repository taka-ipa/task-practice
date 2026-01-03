"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";

type Task = {
  id: number;
  title: string;
  description: string | null;
  sort_order: number | null;
};

type Rating = "○" | "△" | "×" | "-";

type MatchForm = {
  played_at: string; // datetime-local (YYYY-MM-DDTHH:mm)
  rule: string;
  stage: string;
  is_win: boolean;
};

export default function NewMatchPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // 例：最低限の試合フォーム（必要なければ後で足してOK）
  const [form, setForm] = useState<MatchForm>({
    played_at: "",
    rule: "",
    stage: "",
    is_win: true,
  });

  // ✅ ratings を Record で持つ
  const [ratings, setRatings] = useState<Record<number, Rating>>({});

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  type ApiValidationErrors = Record<string, string[]>;
  const [errors, setErrors] = useState<ApiValidationErrors>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoadingTasks(true);
        const res = await api.get("/api/tasks");
        const list: Task[] = res.data?.data ?? res.data; // dataラップどっちでも耐える
        setTasks(list);

        const resetForm = () => {
          setForm({
            played_at: "",
            rule: "",
            stage: "",
            is_win: true,
          });
        
          // tasks は残ってるので、ratings を "-" に戻す
          setRatings((prev) => {
            const next: Record<number, Rating> = {};
            for (const t of tasks) next[t.id] = "-";
            return next;
          });

          setSubmittedOnce(false);
          setErrors({});
        };
        // 初期値：未設定のものは "-" 扱い。stateに全部入れたいならここで埋める
        setRatings((prev) => {
          const next = { ...prev };
          for (const t of list) {
            if (next[t.id] == null) next[t.id] = "-";
          }
          return next;
        });
      } catch (e) {
        console.error(e);
        setMessage("課題の取得に失敗しました");
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();
  }, []);

  const ratingArray = useMemo(() => {
    // ✅ Record<number, Rating> → [{task_id, rating}] に変換
    return Object.entries(ratings).map(([taskId, rating]) => ({
      task_id: Number(taskId),
      rating,
    }));
  }, [ratings]);

  const resetForm = () => {
    setForm({
      played_at: "",
      rule: "",
      stage: "",
      is_win: true,
    });

    // tasks は残ってるので、ratings を "-" に戻す
    setRatings((prev) => {
      const next: Record<number, Rating> = {};
      for (const t of tasks) next[t.id] = "-";
      return next;
    });

    setSubmittedOnce(false);
    setErrors({});
  };

  const onSubmit = async () => {
    setMessage("");
    setSubmittedOnce(true);
    setErrors({});
    setSaving(true);

    try {
      const payload = {
        played_at: form.played_at || null,
        rule: form.rule || null,
        stage: form.stage || null,
        is_win: form.is_win,
        ratings: ratingArray,
      };

      const res = await api.post("/api/matches-with-ratings", payload);
      console.log(res.data);
      setMessage("保存しました ✅");

      // 保存成功後、フォームをリセット
      resetForm();
    } catch (e: any) {
      console.error(e);

      // 422（バリデーション）を一旦ざっくり出す
      if (e?.response?.status === 422) {
        const apiErrors = e?.response?.data?.errors;
        setErrors(apiErrors);
        setMessage("入力内容を確認してください");
      } else {
        setMessage("保存に失敗しました");
      }
    } finally {
      setSaving(false);
    }
  };

  const setTaskRating = (taskId: number, rating: Rating) => {
    setRatings((prev) => ({ ...prev, [taskId]: rating }));
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">試合追加</h1>

      {/* 最低限の試合フォーム */}
      <div className="space-y-3 rounded-xl border p-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm">played_at</label>
          <input
            type="datetime-local"
            value={form.played_at}
            onChange={(e) => setForm((p) => ({ ...p, played_at: e.target.value }))}
            className="rounded-md border p-2"
          />
          {submittedOnce && !form.played_at && !errors.played_at && (
            <p className="text-xs text-muted-foreground">
              試合日時を入力してね（未入力でもOK運用ならこのままでもOK）
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm">rule</label>
            <input
              value={form.rule}
              onChange={(e) => setForm((p) => ({ ...p, rule: e.target.value }))}
              className="w-full rounded-md border p-2"
              placeholder="エリア / ヤグラ…"
            />
            {submittedOnce && !form.rule && !errors.rule && (
              <p className="mt-1 text-xs text-muted-foreground">ルールを入力してね</p>
            )}
          </div>
          <div className="flex-1">
            <label className="text-sm">stage</label>
            <input
              value={form.stage}
              onChange={(e) => setForm((p) => ({ ...p, stage: e.target.value }))}
              className="w-full rounded-md border p-2"
              placeholder="マップ名"
            />
            {submittedOnce && !form.stage && !errors.stage && (
              <p className="mt-1 text-xs text-muted-foreground">ステージを入力してね</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm">勝敗</label>
          <select
            value={form.is_win ? "win" : "lose"}
            onChange={(e) => setForm((p) => ({ ...p, is_win: e.target.value === "win" }))}
            className="rounded-md border p-2"
          >
            <option value="win">勝ち</option>
            <option value="lose">負け</option>
          </select>
        </div>
      </div>

      {/* 課題一覧＋評価 */}
      <div className="space-y-3 rounded-xl border p-4">
        <h2 className="font-semibold">課題評価（○△×）</h2>

        {loadingTasks ? (
          <p>読み込み中...</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{t.title}</div>
                  {t.description && <div className="text-sm opacity-70">{t.description}</div>}
                </div>

                <div className="flex gap-2">
                  {(["○", "△", "×", "-"] as Rating[]).map((r) => {
                    const active = ratings[t.id] === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTaskRating(t.id, r)}
                        className={[
                          "rounded-lg border px-3 py-2 text-sm",
                          active ? "bg-black text-white" : "bg-white",
                        ].join(" ")}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 保存 */}
      <div className="space-y-2">
        {Object.keys(errors).length > 0 && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm">
             <p className="font-medium text-red-700">入力エラーがあります</p>
             <ul className="mt-2 list-disc pl-5 text-red-700">
               {Object.entries(errors).flatMap(([field, msgs]) =>
                 msgs.map((m, i) => (
                   <li key={`${field}-${i}`}>
                     {field === "played_at" ? `played_at: ${m}` :
                      field === "rule" ? `rule: ${m}` :
                      field === "stage" ? `stage: ${m}` :
                      field === "is_win" ? `is_win: ${m}` :
                      field === "ratings" ? `ratings: ${m}` :
                      `${field}: ${m}`}
                   </li>
                 ))
               )}
             </ul>
          </div>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving || loadingTasks}
          className="rounded-xl bg-black px-4 py-3 text-white disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>

        {message && <p className="text-sm">{message}</p>}
      </div>

      <button
        type="button"
        onClick={async () => {
          const res = await api.get("/api/matches");
          console.log("matches:", res.data);
          alert("consoleに出したよ！");
        }}
        className="rounded-xl border px-4 py-3"
      >
        （デバッグ）試合一覧を取得してconsole表示
      </button>
    </div>
  );
}
