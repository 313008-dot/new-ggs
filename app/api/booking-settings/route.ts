import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getBookingSettings,
  setBlockedTimes,
} from "@/lib/booking-settings-store";

export async function GET() {
  const settings = await getBookingSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (auth) return auth;

  const body = (await req.json().catch(() => null)) as
    | { date?: string; blockedTimes?: string[] }
    | null;

  const date = (body?.date ?? "").trim();
  const blockedTimes = Array.isArray(body?.blockedTimes)
    ? body?.blockedTimes.filter((t) => typeof t === "string").map((t) => t.trim())
    : null;

  if (!date || !blockedTimes) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const next = await setBlockedTimes(date, blockedTimes);
  return NextResponse.json({ settings: next });
}

