import { useState, useEffect, useCallback, useRef } from "react";
import {
	Play,
	Square,
	Minus,
	Plus,
	Clock,
	CalendarDays,
	TrendingUp,
	Gift,
} from "lucide-react";
import GlassCard from "../components/GlassCard";
import Modal from "../components/Modal";
import TimePicker from "../components/TimePicker";
import { useSettings } from "../hooks/useSettingsContext";
import {
	getActiveSession,
	startSession,
	clearSession,
} from "../db/activeSession";
import {
	addTimeEntry,
	getTimeEntriesByDate,
	getTimeEntriesForDateRange,
} from "../db/timeEntry";
import {
	getCurrentTimeStr,
	parseTime,
	formatDuration,
	calcDuration,
	isoToTimeStr,
	getRequiredBreakMinutes,
} from "../lib/time";
import {
	todayISO,
	formatDateISO,
	getWeekDates,
	getDayKey,
	dayNameShort,
	dayKeyFromIndex,
	type DayKey,
} from "../lib/dates";
import { fetchBavarianHolidays, type PublicHoliday } from "../lib/holidays";
import type { ActiveSession } from "../db/database";

export default function Home() {
	const { settings } = useSettings();
	const [session, setSession] = useState<ActiveSession | undefined>();
	const [showStartModal, setShowStartModal] = useState(false);
	const [showStopModal, setShowStopModal] = useState(false);
	const [adjustedTime, setAdjustedTime] = useState("");
	const [breakMinutes, setBreakMinutes] = useState(0);
	const [todayMinutes, setTodayMinutes] = useState(0);
	const [weekMinutes, setWeekMinutes] = useState(0);
	const [weekDayMinutes, setWeekDayMinutes] = useState<
		Record<string, number>
	>({});
	const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
	const [now, setNow] = useState(getCurrentTimeStr());
	const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

	const today = todayISO();
	const weekDates = getWeekDates(new Date());
	const weekTarget = settings.weeklyTargetHours * 60;
	const dailyTarget = weekTarget / 5;

	const loadSession = useCallback(async () => {
		const s = await getActiveSession();
		setSession(s);
	}, []);

	const loadStats = useCallback(async () => {
		const todayEntries = await getTimeEntriesByDate(today);
		const todaySum = todayEntries.reduce(
			(sum, e) =>
				sum + calcDuration(e.startTime, e.endTime, e.breakMinutes),
			0,
		);
		setTodayMinutes(todaySum);

		const weekStart = formatDateISO(weekDates[0]);
		const weekEnd = formatDateISO(weekDates[6]);
		const weekEntries = await getTimeEntriesForDateRange(
			weekStart,
			weekEnd,
		);
		let wSum = 0;
		const dayMap: Record<string, number> = {};
		for (const e of weekEntries) {
			const mins = calcDuration(e.startTime, e.endTime, e.breakMinutes);
			wSum += mins;
			dayMap[e.date] = (dayMap[e.date] || 0) + mins;
		}
		setWeekMinutes(wSum);
		setWeekDayMinutes(dayMap);
	}, [today]);

	useEffect(() => {
		loadSession();
		loadStats();
	}, [loadSession, loadStats]);

	useEffect(() => {
		const year = new Date().getFullYear();
		fetchBavarianHolidays(year).then(setPublicHolidays);
	}, []);

	useEffect(() => {
		timerRef.current = setInterval(
			() => setNow(getCurrentTimeStr()),
			30000,
		);
		return () => clearInterval(timerRef.current);
	}, []);

	const handleBuzzerPress = () => {
		setAdjustedTime(getCurrentTimeStr());
		if (session) {
			const grossMinutes =
				parseTime(getCurrentTimeStr()) -
				parseTime(isoToTimeStr(session.startTime));
			setBreakMinutes(
				getRequiredBreakMinutes(todayMinutes + grossMinutes),
			);
			setShowStopModal(true);
		} else {
			setShowStartModal(true);
		}
	};

	const confirmStart = async () => {
		const iso = `${today}T${adjustedTime}:00`;
		await startSession(iso, today);
		await loadSession();
		setShowStartModal(false);
	};

	const confirmStop = async () => {
		if (!session) return;
		const startTimeStr = isoToTimeStr(session.startTime);
		await addTimeEntry({
			date: session.date,
			startTime: startTimeStr,
			endTime: adjustedTime,
			breakMinutes,
		});
		await clearSession();
		setSession(undefined);
		setShowStopModal(false);
		await loadStats();
	};

	const remaining = Math.max(0, weekTarget - weekMinutes);
	const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

	let sessionElapsed = 0;
	if (session) {
		const startMin = parseTime(isoToTimeStr(session.startTime));
		const nowMin = parseTime(now);
		sessionElapsed = Math.max(0, nowMin - startMin);
	}

	const sessionBreak = session
		? getRequiredBreakMinutes(todayMinutes + sessionElapsed)
		: 0;

	const isHoliday = (dateStr: string): boolean => {
		return (
			settings.holidays.includes(dateStr) ||
			publicHolidays.some(h => h.date === dateStr)
		);
	};

	const holidayMinutes = weekDates.reduce((sum, d) => {
		const dateStr = formatDateISO(d);
		return sum + (isHoliday(dateStr) ? dailyTarget : 0);
	}, 0);

	const liveRemaining = Math.max(
		0,
		remaining - (session ? sessionElapsed : 0) - holidayMinutes,
	);

	const todayWorked = todayMinutes > 0 || !!session;

	const remainingActiveDays = weekDates
		.map((d, i) => ({
			date: d,
			idx: i,
			key: getDayKey(d),
			dateStr: formatDateISO(d),
		}))
		.filter(
			({ idx, key, dateStr }) =>
				(idx > todayIdx || (idx === todayIdx && !todayWorked)) &&
				settings.activeDays[key as keyof typeof settings.activeDays] &&
				!isHoliday(dateStr),
		);

	const perDay =
		remainingActiveDays.length > 0
			? Math.ceil(liveRemaining / remainingActiveDays.length)
			: 0;

	let stopDuration = 0;
	if (session && showStopModal) {
		stopDuration = Math.max(
			0,
			parseTime(adjustedTime) -
				parseTime(isoToTimeStr(session.startTime)) -
				breakMinutes,
		);
	}

	return (
		<div className="mx-auto flex max-w-md flex-col items-center gap-5 pb-6">
			<button
				onClick={handleBuzzerPress}
				className={`mt-2 flex h-40 w-40 items-center justify-center rounded-full transition-transform duration-200 active:scale-95
          ${
				session
					? "bg-red-50 dark:bg-red-500/10"
					: "bg-green-50 dark:bg-green-500/10"
			}
        `}>
				<div className="flex flex-col items-center gap-2">
					{session ? (
						<Square size={44} className="text-red-500" />
					) : (
						<Play size={44} className="ml-1 text-green-500" />
					)}
					<span className="text-sm font-medium text-gray-500 dark:text-gray-400">
						{session ? "Stoppen" : "Starten"}
					</span>
				</div>
			</button>

			{session && (
				<div className="text-center">
					<p className="text-xs text-gray-500 dark:text-gray-400">
						Läuft seit {isoToTimeStr(session.startTime)}
					</p>
					<p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
						{formatDuration(sessionElapsed)}
					</p>
				</div>
			)}

			<div className="grid w-full grid-cols-2 gap-3">
				<GlassCard className="p-4">
					<div className="mb-1 flex items-center gap-2 text-gray-500 dark:text-gray-400">
						<Clock size={14} />
						<span className="text-xs font-medium">Heute</span>
					</div>
					<p className="text-xl font-bold tabular-nums text-gray-900 dark:text-white">
						{formatDuration(
							todayMinutes +
								(session ? sessionElapsed - sessionBreak : 0),
						)}
						{session && sessionBreak > 0 && (
							<div className="ml-1 text-sm font-normal text-orange-500">
								(+{sessionBreak}m Pause)
							</div>
						)}
					</p>
				</GlassCard>

				<GlassCard className="p-4">
					<div className="mb-1 flex items-center gap-2 text-gray-500 dark:text-gray-400">
						<CalendarDays size={14} />
						<span className="text-xs font-medium">Diese Woche</span>
					</div>
					<p className="text-xl font-bold tabular-nums text-gray-900 dark:text-white">
						{formatDuration(
							weekMinutes + (session ? sessionElapsed : 0),
						)}
					</p>
				</GlassCard>
			</div>

			<GlassCard className="w-full p-4">
				<div className="mb-3 flex items-center gap-2 text-gray-500 dark:text-gray-400">
					<TrendingUp size={14} />
					<span className="text-xs font-medium">
						Verbleibend diese Woche
					</span>
				</div>
				<p className="mb-3 text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
					{formatDuration(liveRemaining)}
				</p>

				<div className="grid grid-cols-7 gap-1">
					{weekDates.map((d, i) => {
						const dateStr = formatDateISO(d);
						const dayKey = dayKeyFromIndex(i) as DayKey;
						const active = settings.activeDays[dayKey];
						const isPast = i < todayIdx;
						const isTodayDay = i === todayIdx;
						const rawWorked = weekDayMinutes[dateStr] || 0;
						const worked =
							isTodayDay && session
								? rawWorked + sessionElapsed
								: rawWorked;
						const dayIsHoliday = isHoliday(dateStr);
						const planned = dayIsHoliday
							? dailyTarget
							: !isPast && active && (!isTodayDay || !todayWorked)
								? perDay
								: 0;

						return (
							<div
								key={i}
								className={`flex flex-col items-center rounded-lg py-1.5 text-center text-[10px] transition-colors
                  ${isTodayDay ? "bg-blue-50 dark:bg-blue-500/10" : ""}
                  ${dayIsHoliday ? "bg-amber-50 dark:bg-amber-500/10" : ""}
                  ${!active && !dayIsHoliday ? "opacity-40" : ""}
                `}>
								<span
									className={`font-medium ${dayIsHoliday ? "text-amber-600 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"}`}>
									{dayNameShort(i)}
								</span>
								{dayIsHoliday && worked === 0 ? (
									<span className="flex items-center gap-0.5 tabular-nums text-amber-500 dark:text-amber-400">
										<Gift size={8} />
										{(dailyTarget / 60).toFixed(1)}h
									</span>
								) : worked > 0 ? (
									<>
										<span className="font-bold tabular-nums text-gray-900 dark:text-white">
											{(
												(worked -
													(isTodayDay && session
														? sessionBreak
														: 0)) /
												60
											).toFixed(1)}
											h
										</span>
										{isTodayDay &&
											session &&
											sessionBreak > 0 && (
												<span className="text-[9px] tabular-nums text-orange-500">
													+{sessionBreak}m
												</span>
											)}
									</>
								) : planned > 0 ? (
									<>
										<span className="tabular-nums text-gray-400 dark:text-gray-500">
											{(planned / 60).toFixed(1)}h
										</span>
										{getRequiredBreakMinutes(planned) >
											0 && (
											<span className="text-[9px] tabular-nums text-orange-400 dark:text-orange-500">
												+
												{getRequiredBreakMinutes(
													planned,
												)}
												m
											</span>
										)}
									</>
								) : (
									<span className="text-gray-300 dark:text-gray-600">
										–
									</span>
								)}
							</div>
						);
					})}
				</div>
			</GlassCard>

			<Modal
				open={showStartModal}
				onClose={() => setShowStartModal(false)}
				title="Arbeit starten"
				actions={
					<>
						<button
							onClick={() => setShowStartModal(false)}
							className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 active:bg-gray-200 dark:bg-white/[0.08] dark:text-gray-300 dark:active:bg-white/[0.12]">
							Abbrechen
						</button>
						<button
							onClick={confirmStart}
							className="flex-1 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white active:bg-blue-600">
							Starten
						</button>
					</>
				}>
				<div className="flex flex-col items-center gap-3 py-2">
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Startzeit anpassen
					</p>
					<TimePicker
						value={adjustedTime}
						onChange={setAdjustedTime}
					/>
				</div>
			</Modal>

			<Modal
				open={showStopModal}
				onClose={() => setShowStopModal(false)}
				title="Arbeit beenden"
				actions={
					<>
						<button
							onClick={() => setShowStopModal(false)}
							className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 active:bg-gray-200 dark:bg-white/[0.08] dark:text-gray-300 dark:active:bg-white/[0.12]">
							Abbrechen
						</button>
						<button
							onClick={confirmStop}
							className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white active:bg-red-600">
							Beenden
						</button>
					</>
				}>
				<div className="flex flex-col items-center gap-4 py-2">
					{session && (
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Gestartet um {isoToTimeStr(session.startTime)}
						</p>
					)}
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Endzeit anpassen
					</p>
					<TimePicker
						value={adjustedTime}
						onChange={setAdjustedTime}
					/>

					<div className="flex items-center gap-3">
						<span className="text-sm text-gray-500 dark:text-gray-400">
							Pause
						</span>
						<button
							onClick={() =>
								setBreakMinutes(b => Math.max(0, b - 5))
							}
							className="rounded-full bg-gray-100 p-2 active:bg-gray-200 dark:bg-white/[0.08] dark:active:bg-white/[0.12]">
							<Minus
								size={16}
								className="text-gray-600 dark:text-gray-300"
							/>
						</button>
						<span className="w-12 text-center text-lg font-bold tabular-nums text-gray-900 dark:text-white">
							{breakMinutes}m
						</span>
						<button
							onClick={() => setBreakMinutes(b => b + 5)}
							className="rounded-full bg-gray-100 p-2 active:bg-gray-200 dark:bg-white/[0.08] dark:active:bg-white/[0.12]">
							<Plus
								size={16}
								className="text-gray-600 dark:text-gray-300"
							/>
						</button>
					</div>

					<div className="rounded-xl bg-blue-50 px-4 py-2 dark:bg-blue-500/10">
						<span className="text-sm text-blue-600 dark:text-blue-400">
							Arbeitszeit:{" "}
							<strong>{formatDuration(stopDuration)}</strong>
						</span>
					</div>
				</div>
			</Modal>
		</div>
	);
}
