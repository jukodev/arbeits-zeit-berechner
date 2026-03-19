import { getDB, type ActiveSession } from "./database";

export async function getActiveSession(): Promise<ActiveSession | undefined> {
	const db = await getDB();
	return db.get("activeSession", "active");
}

export async function startSession(
	startTime: string,
	date: string,
): Promise<void> {
	const db = await getDB();
	await db.put("activeSession", { key: "active", startTime, date });
}

export async function clearSession(): Promise<void> {
	const db = await getDB();
	await db.delete("activeSession", "active");
}
