import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function requireAdmin() {
  const adminEmails = (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e !== "");

  if (adminEmails.length === 0) {
    return NextResponse.json(
      { error: "Server misconfigured: missing ADMIN_EMAIL." },
      { status: 500 },
    );
  }

  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();

  if (email && adminEmails.includes(email)) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

