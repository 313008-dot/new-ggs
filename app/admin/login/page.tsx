import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import GoogleLoginButton from "./google-button";

export const metadata = {
  title: "Admin Login",
};

export default async function AdminLoginPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();

  if (email) {
    if (adminEmail && email === adminEmail) {
      redirect("/admin");
    } else {
      redirect("/");
    }
  }

  return (
    <div className="min-h-dvh bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
          <h1 className="text-xl font-semibold tracking-tight">管理員登入</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            使用 Google 帳號登入後即可查看預約清單。
          </p>
          <GoogleLoginButton />
        </div>
      </main>
    </div>
  );
}

