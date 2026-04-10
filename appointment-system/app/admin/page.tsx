import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import AppointmentTable from "./table";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  
  const adminEmail = process.env.ADMIN_EMAIL;
  if (session.user?.email !== adminEmail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white shadow-lg rounded-lg text-center">
          <h1 className="text-4xl mb-4">??</h1>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">權限不足</h2>
          <p className="text-gray-600 mb-6">您沒有權限進入管理員後台</p>
          <a href="/" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">返回首頁</a>
        </div>
      </div>
    );
  }
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">預約管理系統</h1>
        <div className="text-sm text-gray-500">歡迎, {session.user?.email}</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden"><AppointmentTable /></div>
    </div>
  );
}
