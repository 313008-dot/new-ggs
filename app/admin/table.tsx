"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Appointment = {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  people?: number;
  service?: string;
  status: "active" | "done";
  createdAt: string;
};

function formatCreatedAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function AdminTable() {
  const router = useRouter();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const activeCount = useMemo(
    () => items.filter((i) => i.status !== "done").length,
    [items],
  );

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/appointments", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin/login");
        router.refresh();
        return;
      }
      if (!res.ok) throw new Error("讀取失敗。");
      const payload = (await res.json()) as { appointments: Appointment[] };
      setItems(payload.appointments ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "讀取失敗。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function markDone(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "done" }),
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        router.refresh();
        return;
      }
      if (!res.ok) throw new Error("更新失敗。");
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "更新失敗。");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        router.refresh();
        return;
      }
      if (!res.ok) throw new Error("刪除失敗。");
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "刪除失敗。");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">預約清單</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            目前共有{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {items.length}
            </span>{" "}
            筆（未完成{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {activeCount}
            </span>{" "}
            筆）
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          className="h-10 w-fit rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-200/50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10 dark:focus:ring-white/10"
        >
          重新整理
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200/70 dark:border-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200/70 text-sm dark:divide-white/10">
            <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:bg-white/5 dark:text-zinc-300">
              <tr>
                <th className="px-4 py-3">姓名</th>
                <th className="px-4 py-3">電話</th>
                <th className="px-4 py-3">時間</th>
                <th className="px-4 py-3">項目</th>
                <th className="px-4 py-3">人數</th>
                <th className="px-4 py-3">狀態</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 bg-white dark:divide-white/10 dark:bg-transparent">
              {loading ? (
                <tr>
                  <td
                    className="px-4 py-6 text-zinc-500 dark:text-zinc-400"
                    colSpan={7}
                  >
                    讀取中…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6 text-zinc-500 dark:text-zinc-400"
                    colSpan={7}
                  >
                    目前沒有任何預約紀錄。
                  </td>
                </tr>
              ) : (
                items.map((a) => {
                  const busy = busyId === a.id;
                  return (
                    <tr key={a.id} className="align-top">
                      <td className="px-4 py-4 font-medium text-zinc-900 dark:text-zinc-50">
                        {a.name}
                        <div className="mt-1 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                          建立於 {formatCreatedAt(a.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-zinc-700 dark:text-zinc-200">
                        {a.phone}
                      </td>
                      <td className="px-4 py-4 text-zinc-700 dark:text-zinc-200">
                        <div className="font-medium">
                          {a.date} {a.time}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-zinc-700 dark:text-zinc-200">
                        {a.service ?? "剪髮"}
                      </td>
                      <td className="px-4 py-4 text-zinc-700 dark:text-zinc-200">
                        {a.people ?? 1}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={[
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                            a.status === "done"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100"
                              : "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100",
                          ].join(" ")}
                        >
                          {a.status === "done" ? "已完成" : "未完成"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            disabled={busy || a.status === "done"}
                            onClick={() => markDone(a.id)}
                            className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-200/50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10 dark:focus:ring-white/10"
                          >
                            標記完成
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => remove(a.id)}
                            className="h-9 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-900 shadow-sm transition hover:bg-rose-100 focus:outline-none focus:ring-4 focus:ring-rose-200/40 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100 dark:hover:bg-rose-500/15 dark:focus:ring-rose-500/20"
                          >
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
