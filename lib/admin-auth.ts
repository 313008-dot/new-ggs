import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function requireAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  if (!adminEmail) {
    return NextResponse.json(
      { error: "Server misconfigured: missing ADMIN_EMAIL." },
      { status: 500 },
    );
  }

  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  if (email && email === adminEmail) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

