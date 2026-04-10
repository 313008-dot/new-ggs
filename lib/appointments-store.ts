import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";
import crypto from "node:crypto";

export type AppointmentStatus = "active" | "done";

export type Appointment = {
  id: string; // Keep as string for frontend compatibility
  _id?: ObjectId; // MongoDB internal ID
  name: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  people: number;
  service: string;
  status: AppointmentStatus;
  createdAt: string; // ISO
};

const DB_NAME = "appointment-system";
const COLLECTION_NAME = "appointments";

export async function listAppointments(): Promise<Appointment[]> {
  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection<Appointment>(COLLECTION_NAME);
  const items = await collection
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  
  return items.map(item => ({
    ...item,
    id: item.id || item._id?.toString() || ""
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
  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection<Appointment>(COLLECTION_NAME);
  
  const appt: Appointment = {
    id: crypto.randomUUID(),
    name: input.name,
    phone: input.phone,
    date: input.date,
    time: input.time,
    people: Math.max(1, Math.min(12, Number.isFinite(input.people as number) ? (input.people as number) : 1)),
    service: input.service ?? "剪髮",
    status: "active",
    createdAt: new Date().toISOString(),
  };

  await collection.insertOne(appt);
  return appt;
}

export async function deleteAppointment(id: string) {
  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection<Appointment>(COLLECTION_NAME);
  const result = await collection.deleteOne({ id: id });
  return result.deletedCount > 0;
}

export async function markAppointmentDone(id: string) {
  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection<Appointment>(COLLECTION_NAME);
  const result = await collection.updateOne(
    { id: id },
    { $set: { status: "done" } }
  );
  return result.modifiedCount > 0;
}
