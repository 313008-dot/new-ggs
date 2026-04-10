import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type AppointmentStatus = "active" | "done";

export type Appointment = {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  people: number;
  service: string;
  status: AppointmentStatus;
  createdAt: string;
};

export async function listAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((item) => ({
    id: item.id,
    name: item.name,
    phone: item.phone,
    date: item.date,
    time: item.time,
    people: item.people_count,
    service: item.service,
    status: item.status,
    createdAt: item.created_at,
  }));
}

export async function createAppointment(input: {
  name: string;
  phone: string;
  date: string;
  time: string;
  people?: number;
  service?: string;
}): Promise<Appointment> {
  const appt = {
    id: crypto.randomUUID(),
    name: input.name,
    phone: input.phone,
    date: input.date,
    time: input.time,
    people_count: Math.max(1, Math.min(12, input.people ?? 1)),
    service: input.service ?? "剪髮",
    status: "active",
  };
  const { data, error } = await supabase
    .from("appointments")
    .insert(appt)
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    date: data.date,
    time: data.time,
    people: data.people_count,
    service: data.service,
    status: data.status,
    createdAt: data.created_at,
  };
}

export async function deleteAppointment(id: string) {
  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
}

export async function markAppointmentDone(id: string) {
  const { error } = await supabase
    .from("appointments")
    .update({ status: "done" })
    .eq("id", id);
  if (error) throw error;
  return true;
}