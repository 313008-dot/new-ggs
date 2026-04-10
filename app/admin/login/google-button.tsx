"use client";

import { signIn } from "next-auth/react";

export default function GoogleLoginButton() {
  return (
    <div className="mt-6 grid gap-3">
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/admin" })}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-200/50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:bg-white/10 dark:focus:ring-white/10"
      >
        <span className="text-base">G</span>
        使用 Google 登入
      </button>
      <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        登入後才可查看顧客電話與預約清單。
      </p>
    </div>
  );
}

