import { db } from "./db";

export async function logActivity(userId: string | null, action: string, details: string) {
  await db.activity.create({ data: { userId, action, details } });
}
