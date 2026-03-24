import { useState, useEffect } from "react";
import { Sun, Moon, Monitor, Plus, X, Gift, Calendar } from "lucide-react";
import GlassCard from "../components/GlassCard";
import Modal from "../components/Modal";
import { useSettings } from "../hooks/useSettingsContext";
import {
	dayNameShort,
	dayKeyFromIndex,
	type DayKey,
	formatDateDisplay,
} from "../lib/dates";
import { fetchBavarianHolidays, type PublicHoliday } from "../lib/holidays";

const DAY_LABELS = Array.from({ length: 7 }, (_, i) => ({
	key: dayKeyFromIndex(i) as DayKey,
	label: dayNameShort(i),
}));

export default function Settings() {
	const { settings, updateSettings } = useSettings();
	const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
	const [showAddHoliday, setShowAddHoliday] = useState(false);
	const [newHolidayDate, setNewHolidayDate] = useState("");

	// Load public holidays
	useEffect(() => {
		const year = new Date().getFullYear();
		fetchBavarianHolidays(year).then(setPublicHolidays);
	}, []);

	const toggleDay = (key: DayKey) => {
		updateSettings({
			activeDays: {
				...settings.activeDays,
				[key]: !settings.activeDays[key],
			},
		});
	};

	const addHoliday = () => {
		if (newHolidayDate && !settings.holidays.includes(newHolidayDate)) {
			updateSettings({
				holidays: [...settings.holidays, newHolidayDate].sort(),
			});
		}
		setNewHolidayDate("");
		setShowAddHoliday(false);
	};

	const removeHoliday = (date: string) => {
		updateSettings({
			holidays: settings.holidays.filter(h => h !== date),
		});
	};

	// Upcoming holidays for display (user + public, next 90 days)
	const today = new Date();
	const in90Days = new Date(today);
	in90Days.setDate(in90Days.getDate() + 90);
	const todayStr = today.toISOString().split("T")[0];
	const in90DaysStr = in90Days.toISOString().split("T")[0];

	const upcomingPublicHolidays = publicHolidays
		.filter(h => h.date >= todayStr && h.date <= in90DaysStr)
		.map(h => ({ date: h.date, name: h.name, isPublic: true }));

	const upcomingUserHolidays = settings.holidays
		.filter(
			h =>
				h >= todayStr &&
				h <= in90DaysStr &&
				!publicHolidays.some(ph => ph.date === h),
		)
		.map(h => ({ date: h, name: "Urlaubstag", isPublic: false }));

	const allUpcomingHolidays = [
		...upcomingPublicHolidays,
		...upcomingUserHolidays,
	].sort((a, b) => a.date.localeCompare(b.date));

	const formatHolidayDate = (dateStr: string): string => {
		const d = new Date(dateStr + "T00:00:00");
		return formatDateDisplay(d);
	};

	return (
		<div className="mx-auto flex max-w-md flex-col gap-5 pb-6">
			{/* Weekly target */}
			<GlassCard className="p-5">
				<label className="flex items-center justify-between">
					<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
						Wöchentliche Sollzeit
					</span>
					<div className="flex items-center gap-1">
						<input
							type="number"
							value={settings.weeklyTargetHours}
							onChange={e =>
								updateSettings({
									weeklyTargetHours: Math.max(
										0,
										Number(e.target.value),
									),
								})
							}
							className="w-16 rounded-xl border border-black/10 bg-white/80 px-2 py-1.5 text-right text-sm font-medium text-gray-900 backdrop-blur dark:border-white/10 dark:bg-white/[0.08] dark:text-white"
							min={0}
							step={0.5}
						/>
						<span className="text-sm text-gray-500 dark:text-gray-400">
							h
						</span>
					</div>
				</label>
			</GlassCard>

			{/* Active days */}
			<GlassCard className="p-5">
				<p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
					Arbeitstage
				</p>
				<div className="grid grid-cols-7 gap-2">
					{DAY_LABELS.map(({ key, label }) => {
						const active = settings.activeDays[key];
						return (
							<button
								key={key}
								onClick={() => toggleDay(key)}
								className={`rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-95 ${
									active
										? "bg-blue-500 text-white"
										: "bg-gray-100 text-gray-400 dark:bg-white/[0.06] dark:text-gray-500"
								}`}>
								{label}
							</button>
						);
					})}
				</div>
			</GlassCard>

			{/* Theme */}
			<GlassCard className="p-5">
				<p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
					Erscheinungsbild
				</p>
				<div className="grid grid-cols-3 gap-2">
					{(
						[
							{ value: "light", label: "Hell", Icon: Sun },
							{ value: "dark", label: "Dunkel", Icon: Moon },
							{ value: "system", label: "System", Icon: Monitor },
						] as const
					).map(({ value, label, Icon }) => {
						const active = settings.theme === value;
						return (
							<button
								key={value}
								onClick={() => updateSettings({ theme: value })}
								className={`flex flex-col items-center gap-1.5 rounded-xl py-3 text-xs font-semibold transition-all active:scale-95 ${
									active
										? "bg-blue-500 text-white"
										: "bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400"
								}`}>
								<Icon size={20} />
								{label}
							</button>
						);
					})}
				</div>
			</GlassCard>

			{/* Holidays */}
			<GlassCard className="p-5">
				<div className="mb-3 flex items-center justify-between">
					<p className="text-sm font-medium text-gray-700 dark:text-gray-300">
						Feiertage & Urlaub
					</p>
					<button
						onClick={() => setShowAddHoliday(true)}
						className="flex items-center gap-1 rounded-lg bg-blue-500 px-2.5 py-1.5 text-xs font-medium text-white active:bg-blue-600">
						<Plus size={14} />
						Hinzufügen
					</button>
				</div>
				<p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
					An Feiertagen wird automatisch 1/5 der Wochenstunden
					angenommen.
					<br />
					<span className="text-amber-600 dark:text-amber-400">
						<Gift size={10} className="mr-1 inline" />
						Gesetzliche Feiertage (Bayern) werden automatisch
						erkannt.
					</span>
				</p>

				{allUpcomingHolidays.length > 0 ? (
					<div className="space-y-2">
						{allUpcomingHolidays.map(holiday => (
							<div
								key={holiday.date}
								className={`flex items-center justify-between rounded-lg px-3 py-2 ${
									holiday.isPublic
										? "bg-amber-50 dark:bg-amber-500/10"
										: "bg-gray-50 dark:bg-white/[0.04]"
								}`}>
								<div className="flex items-center gap-2">
									{holiday.isPublic ? (
										<Gift
											size={14}
											className="text-amber-500"
										/>
									) : (
										<Calendar
											size={14}
											className="text-gray-400"
										/>
									)}
									<div>
										<span className="text-sm font-medium text-gray-900 dark:text-white">
											{formatHolidayDate(holiday.date)}
										</span>
										<span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
											{holiday.name}
										</span>
									</div>
								</div>
								{!holiday.isPublic && (
									<button
										onClick={() =>
											removeHoliday(holiday.date)
										}
										className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-300">
										<X size={14} />
									</button>
								)}
							</div>
						))}
					</div>
				) : (
					<p className="text-center text-sm text-gray-400 dark:text-gray-500">
						Keine anstehenden Feiertage
					</p>
				)}
			</GlassCard>

			{/* Add Holiday Modal */}
			<Modal
				open={showAddHoliday}
				onClose={() => setShowAddHoliday(false)}
				title="Urlaubstag hinzufügen"
				actions={
					<>
						<button
							onClick={() => setShowAddHoliday(false)}
							className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 active:bg-gray-200 dark:bg-white/[0.08] dark:text-gray-300 dark:active:bg-white/[0.12]">
							Abbrechen
						</button>
						<button
							onClick={addHoliday}
							disabled={!newHolidayDate}
							className="flex-1 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white active:bg-blue-600 disabled:opacity-50">
							Hinzufügen
						</button>
					</>
				}>
				<div className="flex flex-col items-center gap-3 py-2">
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Datum auswählen
					</p>
					<input
						type="date"
						value={newHolidayDate}
						onChange={e => setNewHolidayDate(e.target.value)}
						className="w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-center text-sm font-medium text-gray-900 backdrop-blur dark:border-white/10 dark:bg-white/[0.08] dark:text-white"
					/>
				</div>
			</Modal>

			<p className="text-center text-xs text-gray-400 dark:text-gray-500">
				v1.0.0
			</p>
		</div>
	);
}
