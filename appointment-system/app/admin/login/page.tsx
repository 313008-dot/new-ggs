"use client";
import { signIn } from "next-auth/react";
export default function AdminLoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-10 bg-white shadow-2xl rounded-2xl text-center max-w-md w-full border border-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">管理員登入</h1>
        <p className="text-gray-500 mb-8">請使用授權的 Google 帳號進入後台</p>
        <button onClick={() => signIn("google", { callbackUrl: "/admin" })}
          className="flex items-center justify-center w-full gap-3 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-all">
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          使用 Google 帳號登入
        </button>
      </div>
    </div>
  );
}
