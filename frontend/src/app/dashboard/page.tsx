type Task = {
  id: number;
  title: string;
  todayRating: "○" | "△" | "×" | "-";
};

const mockTasks: Task[] = [
  { id: 1, title: "初弾精度", todayRating: "○" },
  { id: 2, title: "デス後の立ち位置", todayRating: "△" },
  { id: 3, title: "打開の入り方", todayRating: "×" },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">今日の課題</h1>
          <span className="text-xs text-slate-400">
            ※ 今はモックデータ（あとでAPIにつなぐ）
          </span>
        </header>

        <div className="grid gap-3">
          {mockTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{task.title}</p>
                <p className="text-xs text-slate-400">
                  今日の評価：{task.todayRating}
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                <button className="px-3 py-1 rounded-lg bg-emerald-500/80 hover:bg-emerald-400">
                  ○
                </button>
                <button className="px-3 py-1 rounded-lg bg-amber-500/80 hover:bg-amber-400">
                  △
                </button>
                <button className="px-3 py-1 rounded-lg bg-rose-500/80 hover:bg-rose-400">
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
