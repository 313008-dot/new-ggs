import { NextResponse } from "next/server";
import {
  createAppointment,
  listAppointments,
} from "@/lib/appointments-store";
import { requireAdmin } from "@/lib/admin-auth";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function GET() {
  const auth = await requireAdmin();
  if (auth) return auth;
  const appointments = await listAppointments();
  return NextResponse.json({ appointments });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | {
        name?: string;
        phone?: string;
        date?: string;
        time?: string;
        people?: number;
        service?: string;
      }
    | null;

  const name = (body?.name ?? "").trim();
  const phone = (body?.phone ?? "").trim();
  const date = (body?.date ?? "").trim();
  const time = (body?.time ?? "").trim();
  const service = (body?.service ?? "剪髮").trim();
  const peopleRaw = body?.people;
  const people =
    typeof peopleRaw === "number" && Number.isFinite(peopleRaw)
      ? Math.max(1, Math.min(12, Math.floor(peopleRaw)))
      : 1;

  if (!name || !phone || !date || !time) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 },
    );
  }

  const all = await listAppointments();
  const conflict = all.some(
    (a) => a.status === "active" && a.date === date && a.time === time,
  );
  if (conflict) {
    return NextResponse.json(
      { error: "此時段已被預約，請改選其他時段。" },
      { status: 409 },
    );
  }

  const created = await createAppointment({
    name,
    phone,
    date,
    time,
    people,
    service,
  });
  return NextResponse.json({ appointment: created }, { status: 201 });
}
