import { promises as fs } from "node:fs";
import path from "node:path";

export type BookingSettings = {
  weeklyClosedDays: number[]; // 0=Sun ... 6=Sat
  blockedByDate: Record<string, string[]>; // YYYY-MM-DD -> ["HH:mm", ...]
};

const STORE_PATH = path.join(process.cwd(), "booking-settings.json");

const DEFAULT_SETTINGS: BookingSettings = {
  weeklyClosedDays: [1], // Monday
  blockedByDate: {},
};

async function readSettings(): Promise<BookingSettings> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<BookingSettings>;
    return {
      weeklyClosedDays: Array.isArray(parsed.weeklyClosedDays)
        ? (parsed.weeklyClosedDays as number[])
        : DEFAULT_SETTINGS.weeklyClosedDays,
      blockedByDate:
        parsed.blockedByDate && typeof parsed.blockedByDate === "object"
          ? (parsed.blockedByDate as Record<string, string[]>)
          : {},
    };
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "ENOENT") return DEFAULT_SETTINGS;
    throw err;
  }
}

async function writeSettingsAtomic(next: BookingSettings) {
  const tmpPath = `${STORE_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(next, null, 2), "utf8");
  await fs.rename(tmpPath, STORE_PATH);
}

export async function getBookingSettings() {
  return readSettings();
}

export async function setBlockedTimes(date: string, times: string[]) {
  const s = await readSettings();
  const uniq = Array.from(new Set(times)).sort();
  if (uniq.length === 0) {
    delete s.blockedByDate[date];
  } else {
    s.blockedByDate[date] = uniq;
  }
  await writeSettingsAtomic(s);
  return s;
}

