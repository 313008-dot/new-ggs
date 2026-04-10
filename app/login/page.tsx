import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import LoginButton from "./signin-button";

export const metadata = {
  title: "Login",
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) redirect("/");

  return (
    <div className="min-h-dvh bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
          <h1 className="text-xl font-semibold tracking-tight">登入</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            請先使用 Google 登入後再進行預約。
          </p>
          <LoginButton />
        </div>
      </main>
    </div>
  );
}

