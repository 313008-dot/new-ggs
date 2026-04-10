import clientPromise from "./mongodb";

export type BookingSettings = {
  id: string; // "global"
  weeklyClosedDays: number[]; // 0=Sun ... 6=Sat
  blockedByDate: Record<string, string[]>; // YYYY-MM-DD -> ["HH:mm", ...]
};

const DB_NAME = "appointment-system";
const COLLECTION_NAME = "settings";

const DEFAULT_SETTINGS: BookingSettings = {
  id: "global",
  weeklyClosedDays: [1], // Monday
  blockedByDate: {},
};

export async function getBookingSettings(): Promise<BookingSettings> {
  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection<BookingSettings>(COLLECTION_NAME);
  const settings = await collection.findOne({ id: "global" });
  
  if (!settings) {
    return DEFAULT_SETTINGS;
  }
  
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    blockedByDate: settings.blockedByDate || {},
    weeklyClosedDays: settings.weeklyClosedDays || [1]
  };
}

export async function setBlockedTimes(date: string, times: string[]) {
  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection<BookingSettings>(COLLECTION_NAME);
  
  const current = await getBookingSettings();
  const nextBlockedByDate = { ...current.blockedByDate };
  
  const uniq = Array.from(new Set(times)).sort();
  if (uniq.length === 0) {
    delete nextBlockedByDate[date];
  } else {
    nextBlockedByDate[date] = uniq;
  }
  
  await collection.updateOne(
    { id: "global" },
    { $set: { blockedByDate: nextBlockedByDate } },
    { upsert: true }
  );
  
  return { ...current, blockedByDate: nextBlockedByDate };
}
