import { getDB, DEFAULT_SETTINGS, type Settings } from "./database";

export async function getSettings(): Promise<Settings> {
	const db = await getDB();
	const stored = await db.get("settings", "settings");
	// Merge with defaults to ensure new fields are present (migration)
	return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
	const db = await getDB();
	const current = await getSettings();
	await db.put("settings", { ...current, ...settings, key: "settings" });
}
