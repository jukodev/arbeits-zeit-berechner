import { getDB, type TimeEntry } from "./database";

export async function getAllTimeEntries(): Promise<TimeEntry[]> {
	const db = await getDB();
	return db.getAll("timeEntries");
}

export async function getTimeEntriesByDate(date: string): Promise<TimeEntry[]> {
	const db = await getDB();
	return db.getAllFromIndex("timeEntries", "by-date", date);
}

export async function getTimeEntriesForDateRange(
	startDate: string,
	endDate: string,
): Promise<TimeEntry[]> {
	const db = await getDB();
	const range = IDBKeyRange.bound(startDate, endDate);
	return db.getAllFromIndex("timeEntries", "by-date", range);
}

export async function addTimeEntry(
	entry: Omit<TimeEntry, "id">,
): Promise<number> {
	const db = await getDB();
	return db.add("timeEntries", entry as TimeEntry);
}

export async function updateTimeEntry(entry: TimeEntry): Promise<void> {
	if (entry.id == null) throw new Error("Cannot update entry without id");
	const db = await getDB();
	await db.put("timeEntries", entry);
}

export async function deleteTimeEntry(id: number): Promise<void> {
	const db = await getDB();
	await db.delete("timeEntries", id);
}
