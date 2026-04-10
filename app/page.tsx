"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status: sessionStatus } = useSession();
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
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [people, setPeople] = useState<number>(1);
  const [service, setService] = useState("剪髮");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<
    | { type: "success"; message: string }
    | { type: "error"; message: string }
    | null
  >(null);

  const [blockedTimes, setBlockedTimes] = useState<string[]>([]);
  const [storeClosed, setStoreClosed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const [settingsRes, availRes] = await Promise.all([
          fetch("/api/booking-settings", { cache: "no-store" }),
          fetch(`/api/availability?date=${encodeURIComponent(date)}`, {
            cache: "no-store",
          }),
        ]);
        if (!settingsRes.ok) return;
        const payload = (await settingsRes.json()) as {
          settings?: {
            weeklyClosedDays?: number[];
            blockedByDate?: Record<string, string[]>;
          };
        };
        const availPayload = availRes.ok
          ? ((await availRes.json()) as { blockedTimes?: string[] })
          : { blockedTimes: [] };

        const weeklyClosedDays = Array.isArray(payload.settings?.weeklyClosedDays)
          ? (payload.settings?.weeklyClosedDays as number[])
          : [1];
        const blockedByDate =
          payload.settings?.blockedByDate && typeof payload.settings.blockedByDate === "object"
            ? (payload.settings.blockedByDate as Record<string, string[]>)
            : {};

        const d = new Date(`${date}T00:00:00`);
        const isClosed = !Number.isNaN(d.getTime()) && weeklyClosedDays.includes(d.getDay());
        const listFromSettings = Array.isArray(blockedByDate[date]) ? blockedByDate[date] : [];
        const listFromAppointments = Array.isArray(availPayload.blockedTimes)
          ? availPayload.blockedTimes
          : [];
        const merged = Array.from(new Set([...listFromSettings, ...listFromAppointments])).sort();

        if (cancelled) return;
        setStoreClosed(isClosed);
        setBlockedTimes(merged);
        setTime((prev) => (prev && (isClosed || merged.includes(prev)) ? null : prev));
      } catch {
        // ignore: homepage still works without settings
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [date]);

  async function submit() {
    setNotice(null);

    if (sessionStatus !== "authenticated") {
      setNotice({ type: "error", message: "請先使用 Google 登入後再送出預約。" });
      await signIn("google", { callbackUrl: "/" });
      return;
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    if (!date) {
      setNotice({ type: "error", message: "請先選擇日期。" });
      return;
    }
    if (storeClosed) {
      setNotice({ type: "error", message: "週一公休，當日不提供預約。" });
      return;
    }
    if (!time) {
      setNotice({ type: "error", message: "請先選擇時段。" });
      return;
    }
    if (blockedTimes.includes(time)) {
      setNotice({ type: "error", message: "此時段已無法預約，請改選其他時段。" });
      return;
    }
    if (!cleanName) {
      setNotice({ type: "error", message: "請輸入姓名。" });
      return;
    }
    if (!cleanPhone) {
      setNotice({ type: "error", message: "請輸入電話。" });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          date,
          time,
          people,
          service,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "預約失敗，請稍後再試。");
      }

      setNotice({
        type: "success",
        message: `已收到預約：${date} ${time}，${service}，人數 ${people}。我們會盡快以電話與您確認。`,
      });
      setName("");
      setPhone("");
      setTime(null);
      setPeople(1);
      setService("剪髮");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "預約失敗，請稍後再試。";
      setNotice({ type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-sky-300/40 via-indigo-300/25 to-fuchsia-300/30 blur-3xl dark:from-sky-500/20 dark:via-indigo-500/15 dark:to-fuchsia-500/15" />
        <div className="absolute bottom-[-140px] right-[-140px] h-[520px] w-[520px] rounded-full bg-gradient-to-br from-emerald-300/30 via-teal-300/20 to-cyan-300/20 blur-3xl dark:from-emerald-500/15 dark:via-teal-500/10 dark:to-cyan-500/10" />
      </div>

      <main className="relative mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/admin"
          className="absolute right-4 top-4 text-xs text-zinc-400 transition hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          管理
        </Link>
        <header className="mb-8 flex flex-col gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200/70 bg-white/70 px-4 py-2 text-base font-semibold text-zinc-800 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 sm:text-lg">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            晴の髮型屋｜線上預約
          </div>
          <p className="max-w-2xl text-pretty text-zinc-600 dark:text-zinc-300">
            選擇日期與時段，填寫姓名與手機號碼即可完成預約。我們會盡快以電話與您確認。
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {sessionStatus === "authenticated" ? (
              <>
                <span className="text-zinc-600 dark:text-zinc-300">
                  已登入：{" "}
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {session?.user?.email ?? "Unknown"}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-200/50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:bg-white/10 dark:focus:ring-white/10"
                >
                  登出
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={sessionStatus === "loading"}
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-200/50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:bg-white/10 dark:focus:ring-white/10"
              >
                {sessionStatus === "loading" ? "登入中…" : "使用 Google 登入後預約"}
              </button>
            )}
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">選擇日期</h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  請先挑選日期，再選擇可預約時段。
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                  預約日期
                </span>
                <input
                  type="date"
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-200/40 dark:border-white/10 dark:bg-white/5 dark:focus:border-sky-400 dark:focus:ring-sky-500/20"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </label>

              <div className="grid gap-2">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                  服務項目
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setService("剪髮")}
                    className={[
                      "h-11 rounded-xl border text-sm font-medium shadow-sm transition focus:outline-none focus:ring-4",
                      service === "剪髮"
                        ? "border-sky-300 bg-sky-50 text-sky-800 ring-sky-200/40 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100 dark:ring-sky-500/20"
                        : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 focus:ring-zinc-200/50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10 dark:focus:ring-white/10",
                    ].join(" ")}
                  >
                    剪頭髮
                  </button>
                  <button
                    type="button"
                    onClick={() => setService("燙髮")}
                    className={[
                      "h-11 rounded-xl border text-sm font-medium shadow-sm transition focus:outline-none focus:ring-4",
                      service === "燙髮"
                        ? "border-sky-300 bg-sky-50 text-sky-800 ring-sky-200/40 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100 dark:ring-sky-500/20"
                        : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 focus:ring-zinc-200/50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10 dark:focus:ring-white/10",
                    ].join(" ")}
                  >
                    燙頭髮
                  </button>
                  <button
                    type="button"
                    onClick={() => setService("染髮")}
                    className={[
                      "h-11 rounded-xl border text-sm font-medium shadow-sm transition focus:outline-none focus:ring-4",
                      service === "染髮"
                        ? "border-sky-300 bg-sky-50 text-sky-800 ring-sky-200/40 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100 dark:ring-sky-500/20"
                        : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 focus:ring-zinc-200/50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10 dark:focus:ring-white/10",
                    ].join(" ")}
                  >
                    染頭髮
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  可選時段
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  點選一個時段以繼續
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {timeSlots.map((t) => {
                  const selected = time === t;
                  const disabled = storeClosed || blockedTimes.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        if (!disabled) setTime(t);
                      }}
                      disabled={disabled}
                      className={[
                        "group h-11 rounded-xl border text-sm font-medium shadow-sm transition focus:outline-none focus:ring-4",
                        selected
                          ? "border-sky-300 bg-sky-50 text-sky-800 ring-sky-200/40 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100 dark:ring-sky-500/20"
                          : disabled
                            ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400 opacity-70 dark:border-white/10 dark:bg-white/5 dark:text-zinc-500"
                            : "border-zinc-200 bg-white text-zinc-800 hover:border-sky-300 hover:bg-sky-50 focus:ring-sky-200/40 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:border-sky-500/40 dark:hover:bg-sky-500/10 dark:focus:ring-sky-500/20",
                      ].join(" ")}
                    >
                      <span className="transition group-hover:text-sky-700 dark:group-hover:text-sky-200">
                        {t}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-xl border border-zinc-200/70 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                取消與改期請至少提前  1 小時。
              </div>
            </div>
          </div>

          <aside className="rounded-2xl border border-zinc-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight">預約表單</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              請輸入聯絡資訊，我們將以電話確認細節。
            </p>

            <form
              className="mt-6 grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!submitting) submit();
              }}
            >
              <div className="grid gap-2">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                  預約人數
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((n) => {
                    const on = people === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPeople(n)}
                        className={[
                          "h-11 rounded-xl border text-sm font-medium shadow-sm transition focus:outline-none focus:ring-4",
                          on
                            ? "border-sky-300 bg-sky-50 text-sky-800 ring-sky-200/40 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100 dark:ring-sky-500/20"
                            : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 focus:ring-zinc-200/50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10 dark:focus:ring-white/10",
                        ].join(" ")}
                      >
                        {n} 人
                      </button>
                    );
                  })}
                </div>
              </div>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                  姓名
                </span>
                <input
                  name="name"
                  placeholder="例如：王小明"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-200/40 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-zinc-400 dark:focus:border-sky-400 dark:focus:ring-sky-500/20"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                  手機號碼
                </span>
                <input
                  name="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="例如：0912-345-678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-200/40 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-zinc-400 dark:focus:border-sky-400 dark:focus:ring-sky-500/20"
                />
              </label>

              {notice ? (
                <div
                  className={[
                    "rounded-xl border px-4 py-3 text-sm",
                    notice.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100"
                      : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100",
                  ].join(" ")}
                >
                  {notice.message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:from-sky-500 hover:to-indigo-500 focus:outline-none focus:ring-4 focus:ring-sky-200/40 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-sky-500/20"
              >
                {submitting ? "送出中…" : "送出預約"}
              </button>

              <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                點擊「送出預約」代表您同意我們僅為預約目的使用您的聯絡資訊。
              </p>
            </form>

            <div className="mt-6 grid gap-3 rounded-2xl border border-zinc-200/70 bg-white p-4 text-sm text-zinc-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">門市</span>
                <span className="font-medium">晴の髮型屋</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">聯絡電話</span>
                <span className="font-medium">( 09 ) 313 152 466</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">營業時間</span>
                <span className="font-medium">10:00–18:30</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">公休</span>
                <span className="font-medium">週一公休</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">臨時休息</span>
                <span className="max-w-[120px] truncate text-right font-medium">
                  {blockedTimes.length > 0 ? blockedTimes.join(", ") : "無"}
                </span>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Google Map
                </span>
                <a
                  className="text-xs font-medium text-zinc-500 underline-offset-4 hover:text-zinc-700 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
                  href="https://www.google.com/maps?q=%E6%99%B4%E3%81%AE%E9%AB%AE%E5%9E%8B%E5%B1%8B"
                  target="_blank"
                  rel="noreferrer"
                >
                  在 Google 地圖開啟
                </a>
              </div>
              <div className="aspect-[16/10] w-full bg-zinc-100 dark:bg-white/5">
                <iframe
                  title="晴の髮型屋 Google Map"
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  // NOTE: maps.app.goo.gl short links do NOT work in iframes.
                  // Use an embed-friendly URL instead.
                  src="https://www.google.com/maps?q=%E6%99%B4%E3%81%AE%E9%AB%AE%E5%9E%8B%E5%B1%8B&output=embed"
                />
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
