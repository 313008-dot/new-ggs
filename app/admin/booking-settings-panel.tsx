"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type BookingSettings = {
  weeklyClosedDays: number[];
  blockedByDate: Record<string, string[]>;
};

export default function BookingSettingsPanel() {
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const timeSlots = useMemo(
    () => [
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
      "17:00",
      "17:30",
      "18:00",
    ],
    [],
  );

  const [date, setDate] = useState(today);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await fetch("/api/booking-settings", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin/login");
        router.refresh();
        return;
      }
      if (!res.ok) throw new Error("讀取設定失敗。");
      const payload = (await res.json()) as { settings: BookingSettings };
      const list = payload.settings?.blockedByDate?.[date] ?? [];
      setBlocked(Array.isArray(list) ? list : []);
      setNotice("已載入設定。");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "讀取設定失敗。");
    } finally {
      setLoading(false);
    }
  }

  async function clearDay() {
    if (!confirm(`確定要清空 ${date} 的所有休息時段嗎？`)) return;
    setBlocked([]);
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await fetch("/api/booking-settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date, blockedTimes: [] }),
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        router.refresh();
        return;
      }
      if (!res.ok) throw new Error("清空失敗。");
      setNotice("已清空該日休息時段。");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "清空失敗。");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await fetch("/api/booking-settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date, blockedTimes: blocked }),
      });
      if (res.status === 401) {
        router.replace("/admin/login");
        router.refresh();
        return;
      }
      if (!res.ok) throw new Error("儲存失敗。");
      setNotice("已儲存臨時休息時段。");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "儲存失敗。");
    } finally {
      setLoading(false);
    }
  }

  function toggle(t: string) {
    setBlocked((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].sort(),
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">臨時休息設定</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            設定特定日期不可預約的時段（例如臨時休息、外出、額滿）。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-200/50 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10 dark:focus:ring-white/10"
          >
            載入
          </button>
          <button
            type="button"
            onClick={clearDay}
            disabled={loading}
            className="h-10 rounded-xl border border-rose-200 bg-white px-4 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-200/50 disabled:opacity-60 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100 dark:hover:bg-rose-500/20 dark:focus:ring-rose-500/20"
          >
            清空當日
          </button>
          <button
            type="button"
            onClick={save}
            disabled={loading}
            className="h-10 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:from-sky-500 hover:to-indigo-500 focus:outline-none focus:ring-4 focus:ring-sky-200/40 disabled:opacity-60 dark:focus:ring-sky-500/20"
          >
            儲存
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[240px_1fr]">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
            日期
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setNotice(null);
              setError(null);
            }}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-200/40 dark:border-white/10 dark:bg-white/5 dark:focus:border-sky-400 dark:focus:ring-sky-500/20"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            先選日期，再按「載入」查看既有設定。
          </p>
        </label>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
              不可預約時段
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              已選 {blocked.length} 個
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {timeSlots.map((t) => {
              const on = blocked.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggle(t)}
                  className={[
                    "h-10 rounded-xl border text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-4",
                    on
                      ? "border-rose-200 bg-rose-50 text-rose-900 focus:ring-rose-200/40 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100 dark:focus:ring-rose-500/20"
                      : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 focus:ring-zinc-200/50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10 dark:focus:ring-white/10",
                  ].join(" ")}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {notice ? (
            <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
              {notice}
            </div>
          ) : null}
          {error ? (
            <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

