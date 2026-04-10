import AdminTable from "./table";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import BookingSettingsPanel from "./booking-settings-panel";

export const metadata = {
  title: "Admin | Appointments",
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) redirect("/admin/login");
  if (!adminEmail || email !== adminEmail) redirect("/");

  return (
    <div className="min-h-dvh bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            預約管理
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            這裡會讀取本機的 <span className="font-medium">appointments.json</span>{" "}
            並顯示所有預約紀錄。
          </p>
        </header>

        <div className="mb-6">
          <BookingSettingsPanel />
        </div>

        <AdminTable />
      </main>
    </div>
  );
}

