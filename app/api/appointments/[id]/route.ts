import { NextResponse } from "next/server";
import {
  deleteAppointment,
  markAppointmentDone,
} from "@/lib/appointments-store";
import { requireAdmin } from "@/lib/admin-auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth) return auth;
  const { id } = await params;
  const deleted = await deleteAppointment(id);
  return NextResponse.json({ ok: deleted });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth) return auth;
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as
    | {
        action?: "done";
      }
    | null;

  if (body?.action !== "done") {
    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  }

  const ok = await markAppointmentDone(id);
  return NextResponse.json({ ok });
}

