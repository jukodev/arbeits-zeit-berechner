export interface PublicHoliday {
	date: string;
	name: string;
}

const CACHE_KEY = "bavarian-holidays-cache";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

interface CachedHolidays {
	timestamp: number;
	year: number;
	holidays: PublicHoliday[];
}

export async function fetchBavarianHolidays(
	year: number,
): Promise<PublicHoliday[]> {
	const cached = getCachedHolidays(year);
	if (cached) {
		return cached;
	}

	try {
		const response = await fetch(
			`https://date.nager.at/api/v3/PublicHolidays/${year}/DE`,
		);

		if (!response.ok) {
			console.warn("Failed to fetch holidays, using fallback");
			return getFallbackHolidays(year);
		}

		const data = await response.json();

		const bavarianHolidays: PublicHoliday[] = data
			.filter(
				(h: { counties: string[] | null }) =>
					!h.counties || h.counties.includes("DE-BY"),
			)
			.map((h: { date: string; localName: string }) => ({
				date: h.date,
				name: h.localName,
			}));

		cacheHolidays(year, bavarianHolidays);

		return bavarianHolidays;
	} catch (error) {
		console.warn("Error fetching holidays:", error);
		return getFallbackHolidays(year);
	}
}

function getCachedHolidays(year: number): PublicHoliday[] | null {
	try {
		const raw = localStorage.getItem(CACHE_KEY);
		if (!raw) return null;

		const cached: CachedHolidays = JSON.parse(raw);
		const isExpired = Date.now() - cached.timestamp > CACHE_DURATION_MS;
		const isSameYear = cached.year === year;

		if (!isExpired && isSameYear) {
			return cached.holidays;
		}
	} catch {}
	return null;
}

function cacheHolidays(year: number, holidays: PublicHoliday[]): void {
	try {
		const cache: CachedHolidays = {
			timestamp: Date.now(),
			year,
			holidays,
		};
		localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
	} catch {}
}

function getFallbackHolidays(year: number): PublicHoliday[] {
	const fixed: PublicHoliday[] = [
		{ date: `${year}-01-01`, name: "Neujahr" },
		{ date: `${year}-01-06`, name: "Heilige Drei Könige" },
		{ date: `${year}-05-01`, name: "Tag der Arbeit" },
		{ date: `${year}-08-15`, name: "Mariä Himmelfahrt" },
		{ date: `${year}-10-03`, name: "Tag der Deutschen Einheit" },
		{ date: `${year}-11-01`, name: "Allerheiligen" },
		{ date: `${year}-12-25`, name: "1. Weihnachtstag" },
		{ date: `${year}-12-26`, name: "2. Weihnachtstag" },
	];

	const easter = calculateEaster(year);
	const easterDependent: PublicHoliday[] = [
		{ date: addDays(easter, -2), name: "Karfreitag" },
		{ date: addDays(easter, 1), name: "Ostermontag" },
		{ date: addDays(easter, 39), name: "Christi Himmelfahrt" },
		{ date: addDays(easter, 50), name: "Pfingstmontag" },
		{ date: addDays(easter, 60), name: "Fronleichnam" },
	];

	return [...fixed, ...easterDependent].sort((a, b) =>
		a.date.localeCompare(b.date),
	);
}

/**
 * Calculate Easter Sunday for a given year (Anonymous Gregorian algorithm)
 */
function calculateEaster(year: number): Date {
	const a = year % 19;
	const b = Math.floor(year / 100);
	const c = year % 100;
	const d = Math.floor(b / 4);
	const e = b % 4;
	const f = Math.floor((b + 8) / 25);
	const g = Math.floor((b - f + 1) / 3);
	const h = (19 * a + b - d - g + 15) % 30;
	const i = Math.floor(c / 4);
	const k = c % 4;
	const l = (32 + 2 * e + 2 * i - h - k) % 7;
	const m = Math.floor((a + 11 * h + 22 * l) / 451);
	const month = Math.floor((h + l - 7 * m + 114) / 31);
	const day = ((h + l - 7 * m + 114) % 31) + 1;
	return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): string {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return formatDateISO(result);
}

function formatDateISO(d: Date): string {
	const y = d.getFullYear();
	const m = (d.getMonth() + 1).toString().padStart(2, "0");
	const day = d.getDate().toString().padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export function isPublicHoliday(
	dateStr: string,
	holidays: PublicHoliday[],
): boolean {
	return holidays.some(h => h.date === dateStr);
}

export function getHolidayName(
	dateStr: string,
	holidays: PublicHoliday[],
): string | null {
	const holiday = holidays.find(h => h.date === dateStr);
	return holiday?.name ?? null;
}
