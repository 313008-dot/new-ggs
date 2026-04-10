import { NextResponse } from "next/server";
import { listAppointments } from "@/lib/appointments-store";
import { getBookingSettings } from "@/lib/booking-settings-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = (searchParams.get("date") ?? "").trim();
  if (!date) {
    return NextResponse.json(
      { error: "Missing date parameter." },
      { status: 400 },
    );
  }

  const [settings, all] = await Promise.all([
    getBookingSettings(),
    listAppointments(),
  ]);

  const booked = all
    .filter((a) => a.status === "active" && a.date === date)
    .map((a) => a.time);

  const blockedBySettings = settings.blockedByDate?.[date] ?? [];

  const blockedTimes = Array.from(
    new Set([...(blockedBySettings ?? []), ...booked]),
  ).sort();

  return NextResponse.json({ blockedTimes });
}
