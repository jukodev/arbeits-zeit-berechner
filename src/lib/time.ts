/** Parse "HH:mm" to total minutes since midnight */
export function parseTime(t: string): number {
	const [h, m] = t.split(":").map(Number);
	return h * 60 + m;
}

/** Format total minutes to "Xh Ym" */
export function formatDuration(totalMinutes: number): string {
	const sign = totalMinutes < 0 ? "-" : "";
	const abs = Math.abs(Math.round(totalMinutes));
	const h = Math.floor(abs / 60);
	const m = abs % 60;
	return `${sign}${h}h ${m.toString().padStart(2, "0")}m`;
}

/** Format total minutes to decimal hours like "8.5" */
export function formatHoursDecimal(totalMinutes: number): string {
	return (totalMinutes / 60).toFixed(1);
}

/** Calculate work duration in minutes from start/end time strings and break */
export function calcDuration(
	start: string,
	end: string,
	breakMinutes: number,
): number {
	return Math.max(0, parseTime(end) - parseTime(start) - breakMinutes);
}

/** Get current time as "HH:mm" */
export function getCurrentTimeStr(): string {
	const now = new Date();
	return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
}

/** Add minutes to a "HH:mm" string, clamped to 00:00–23:59 */
export function addMinutesToTime(time: string, mins: number): string {
	let total = parseTime(time) + mins;
	total = Math.max(0, Math.min(total, 23 * 60 + 59));
	const h = Math.floor(total / 60);
	const m = total % 60;
	return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/** Convert ISO datetime string to "HH:mm" */
export function isoToTimeStr(iso: string): string {
	const d = new Date(iso);
	return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

/** Create ISO datetime from date string and time string */
export function dateAndTimeToISO(date: string, time: string): string {
	return `${date}T${time}:00`;
}
