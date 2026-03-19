import { getDB, DEFAULT_SETTINGS, type Settings } from "./database";

export async function getSettings(): Promise<Settings> {
	const db = await getDB();
	const stored = await db.get("settings", "settings");
	return stored ?? { ...DEFAULT_SETTINGS };
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
	const db = await getDB();
	const current = await getSettings();
	await db.put("settings", { ...current, ...settings, key: "settings" });
}
