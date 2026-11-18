export function parseTime(t: string): number {
	const [h, m] = t.split(":").map(Number);
	return h * 60 + m;
}

export function formatDuration(totalMinutes: number): string {
	const sign = totalMinutes < 0 ? "-" : "";
	const abs = Math.abs(Math.round(totalMinutes));
	const h = Math.floor(abs / 60);
	const m = abs % 60;
	return `${sign}${h}h ${m.toString().padStart(2, "0")}m`;
}

export function formatHoursDecimal(totalMinutes: number): string {
	return (totalMinutes / 60).toFixed(1);
}

export function calcDuration(
	start: string,
	end: string,
	breakMinutes: number,
): number {
	return Math.max(0, parseTime(end) - parseTime(start) - breakMinutes);
}

export function getCurrentTimeStr(): string {
	const now = new Date();
	return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
}

export function addMinutesToTime(time: string, mins: number): string {
	let total = parseTime(time) + mins;
	total = Math.max(0, Math.min(total, 23 * 60 + 59));
	const h = Math.floor(total / 60);
	const m = total % 60;
	return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function getLatestClockOutTime(
	start: string,
	alreadyWorkedMinutes: number,
	availableMinutes: number,
	alreadyTakenBreak = 0,
	capAtMidnight = true,
): string | null {
	const startMinute = parseTime(start);
	const maxNetMinutes = Math.floor(availableMinutes - 2);
	if (maxNetMinutes < 0) return null;

	const breakMinutes = Math.max(0, getRequiredBreakMinutes(
		alreadyWorkedMinutes + maxNetMinutes,
	) - alreadyTakenBreak);
	const deadline = startMinute + maxNetMinutes + breakMinutes;
	if (!capAtMidnight && deadline > 23 * 60 + 59) return null;
	const endMinute = Math.min(deadline, 23 * 60 + 59);
	return `${Math.floor(endMinute / 60)
		.toString()
		.padStart(2, "0")}:${(endMinute % 60)
		.toString()
		.padStart(2, "0")}`;
}

export function isoToTimeStr(iso: string): string {
	const d = new Date(iso);
	return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function getRequiredBreakMinutes(workMinutes: number): number {
	if (workMinutes > 360) return 30;
	return 0;
}

export function getRequiredBreakMinutesForElapsed(
	grossMinutes: number,
	alreadyWorkedMinutes: number,
	alreadyTakenBreak = 0,
): number {
	const totalGrossMinutes = alreadyWorkedMinutes + grossMinutes;
	return Math.max(0, getRequiredBreakMinutes(totalGrossMinutes) - alreadyTakenBreak);
}

export function dateAndTimeToISO(date: string, time: string): string {
	return `${date}T${time}:00`;
}
