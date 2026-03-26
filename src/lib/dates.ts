export function formatDateISO(d: Date): string {
	const y = d.getFullYear();
	const m = (d.getMonth() + 1).toString().padStart(2, "0");
	const day = d.getDate().toString().padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export function getWeekDates(date: Date): Date[] {
	const d = new Date(date);
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	const monday = new Date(d);
	monday.setDate(d.getDate() + diff);
	monday.setHours(0, 0, 0, 0);

	return Array.from({ length: 7 }, (_, i) => {
		const date = new Date(monday);
		date.setDate(monday.getDate() + i);
		return date;
	});
}

const DAY_NAMES_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export type DayKey = (typeof DAY_KEYS)[number];

export function dayNameShort(weekdayIdx: number): string {
	return DAY_NAMES_SHORT[weekdayIdx];
}

export function getDayKey(date: Date): DayKey {
	const day = date.getDay();
	const idx = day === 0 ? 6 : day - 1;
	return DAY_KEYS[idx];
}

export function dayKeyFromIndex(idx: number): DayKey {
	return DAY_KEYS[idx];
}

export function formatDateDisplay(d: Date): string {
	const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
	const day = d.getDate().toString().padStart(2, "0");
	const month = (d.getMonth() + 1).toString().padStart(2, "0");
	return `${DAY_NAMES_SHORT[idx]}, ${day}.${month}.`;
}

export function isToday(dateStr: string): boolean {
	return dateStr === formatDateISO(new Date());
}

export function getWeekNumber(d: Date): number {
	const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
	date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
	const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
	return Math.ceil(
		((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
	);
}

export function todayISO(): string {
	return formatDateISO(new Date());
}
