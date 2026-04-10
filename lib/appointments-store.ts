import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type AppointmentStatus = "active" | "done";

export type Appointment = {
  id: string;
  name: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  people: number;
  service: string;
  status: AppointmentStatus;
  createdAt: string; // ISO
};

type StoreShape = {
  appointments: Appointment[];
};

const STORE_PATH = path.join(process.cwd(), "appointments.json");

function newId() {
  return crypto.randomUUID();
}

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    const appointments = Array.isArray(parsed.appointments)
      ? (parsed.appointments as Appointment[])
      : [];
    return { appointments };
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "ENOENT") return { appointments: [] };
    throw err;
  }
}

async function writeStoreAtomic(next: StoreShape) {
  const tmpPath = `${STORE_PATH}.tmp`;
  const payload = JSON.stringify(next, null, 2);
  await fs.writeFile(tmpPath, payload, "utf8");
  await fs.rename(tmpPath, STORE_PATH);
}

export async function listAppointments(): Promise<Appointment[]> {
  const store = await readStore();
  return store.appointments
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createAppointment(input: {
  name: string;
  phone: string;
  date: string;
  time: string;
  people?: number;
  service?: string;
}): Promise<Appointment> {
  const store = await readStore();
  const appt: Appointment = {
    id: newId(),
    name: input.name,
    phone: input.phone,
    date: input.date,
    time: input.time,
    people: Math.max(1, Math.min(12, Number.isFinite(input.people as number) ? (input.people as number) : 1)),
    service: input.service ?? "剪髮",
    status: "active",
    createdAt: new Date().toISOString(),
  };
  store.appointments.push(appt);
  await writeStoreAtomic(store);
  return appt;
}

export async function deleteAppointment(id: string) {
  const store = await readStore();
  const before = store.appointments.length;
  store.appointments = store.appointments.filter((a) => a.id !== id);
  const deleted = store.appointments.length !== before;
  if (deleted) await writeStoreAtomic(store);
  return deleted;
}

export async function markAppointmentDone(id: string) {
  const store = await readStore();
  const appt = store.appointments.find((a) => a.id === id);
  if (!appt) return false;
  appt.status = "done";
  await writeStoreAtomic(store);
  return true;
}
