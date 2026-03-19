import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface TimeEntry {
	id?: number;
	date: string; // YYYY-MM-DD
	startTime: string; // HH:mm
	endTime: string; // HH:mm
	breakMinutes: number;
}

export interface Settings {
	key: string; // always 'settings'
	weeklyTargetHours: number;
	activeDays: {
		mon: boolean;
		tue: boolean;
		wed: boolean;
		thu: boolean;
		fri: boolean;
		sat: boolean;
		sun: boolean;
	};
	theme: "light" | "dark" | "system";
}

export interface ActiveSession {
	key: string; // always 'active'
	startTime: string; // ISO datetime string
	date: string; // YYYY-MM-DD
}

interface AZBDatabase extends DBSchema {
	timeEntries: {
		key: number;
		value: TimeEntry;
		indexes: { "by-date": string };
	};
	settings: {
		key: string;
		value: Settings;
	};
	activeSession: {
		key: string;
		value: ActiveSession;
	};
}

let dbPromise: Promise<IDBPDatabase<AZBDatabase>> | null = null;

export function getDB(): Promise<IDBPDatabase<AZBDatabase>> {
	if (!dbPromise) {
		dbPromise = openDB<AZBDatabase>("azb-db", 1, {
			upgrade(db) {
				const entryStore = db.createObjectStore("timeEntries", {
					keyPath: "id",
					autoIncrement: true,
				});
				entryStore.createIndex("by-date", "date");
				db.createObjectStore("settings", { keyPath: "key" });
				db.createObjectStore("activeSession", { keyPath: "key" });
			},
		});
	}
	return dbPromise;
}

export const DEFAULT_SETTINGS: Settings = {
	key: "settings",
	weeklyTargetHours: 40,
	activeDays: {
		mon: true,
		tue: true,
		wed: true,
		thu: true,
		fri: true,
		sat: false,
		sun: false,
	},
	theme: "system",
};
