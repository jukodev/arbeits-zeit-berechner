import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface TimeEntry {
	id?: number;
	date: string;
	startTime: string;
	endTime: string;
	breakMinutes: number;
}

export interface Settings {
	key: string;
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
	holidays: string[];
}

export interface ActiveSession {
	key: string;
	startTime: string;
	date: string;
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
	holidays: [],
};
