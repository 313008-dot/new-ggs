import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type BookingSettings = {
  id: string;
  weeklyClosedDays: number[];
  blockedByDate: Record<string, string[]>;
};

const DEFAULT_SETTINGS: BookingSettings = {
  id: "global",
  weeklyClosedDays: [1],
  blockedByDate: {},
};

export async function getBookingSettings(): Promise<BookingSettings> {
  const { data, error } = await supabase
    .from("booking_settings")
    .select("*")
    .single();

  if (error || !data) return DEFAULT_SETTINGS;

  return {
    id: "global",
    weeklyClosedDays: data.closed_days || [1],
    blockedByDate: data.blocked_by_date || {},
  };
}

export async function setBlockedTimes(date: string, times: string[]) {
  const current = await getBookingSettings();
  const nextBlockedByDate = { ...current.blockedByDate };

  const uniq = Array.from(new Set(times)).sort();
  if (uniq.length === 0) {
    delete nextBlockedByDate[date];
  } else {
    nextBlockedByDate[date] = uniq;
  }

  const { error } = await supabase
    .from("booking_settings")
    .update({ blocked_by_date: nextBlockedByDate })
    .eq("id", (await supabase.from("booking_settings").select("id").single()).data?.id);

  if (error) throw error;

  return { ...current, blockedByDate: nextBlockedByDate };
}