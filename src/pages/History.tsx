import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Minus } from "lucide-react";
import GlassCard from "../components/GlassCard";
import TimePicker from "../components/TimePicker";
import { useSettings } from "../hooks/useSettingsContext";
import {
	getTimeEntriesForDateRange,
	addTimeEntry,
	updateTimeEntry,
	deleteTimeEntry,
} from "../db/timeEntry";
import { calcDuration, formatDuration } from "../lib/time";
import {
	getWeekDates,
	formatDateISO,
	formatDateDisplay,
	getWeekNumber,
	getDayKey,
	isToday,
} from "../lib/dates";
import type { TimeEntry } from "../db/database";

export default function History() {
	const { settings } = useSettings();
	const [weekOffset, setWeekOffset] = useState(0);
	const [entries, setEntries] = useState<TimeEntry[]>([]);
	const [editor, setEditor] = useState<{
		mode: "add" | "edit";
		entryId?: number;
		date: string;
		startTime: string;
		endTime: string;
		breakMinutes: number;
	} | null>(null);

	const baseDate = new Date();
	baseDate.setDate(baseDate.getDate() + weekOffset * 7);
	const weekDates = getWeekDates(baseDate);
	const weekNum = getWeekNumber(weekDates[0]);

	const loadEntries = useCallback(async () => {
		const start = formatDateISO(weekDates[0]);
		const end = formatDateISO(weekDates[6]);
		const data = await getTimeEntriesForDateRange(start, end);
		setEntries(data);
	}, [weekOffset]);

	useEffect(() => {
		loadEntries();
	}, [loadEntries]);

	const weekTotal = entries.reduce(
		(sum, e) => sum + calcDuration(e.startTime, e.endTime, e.breakMinutes),
		0,
	);

	const target = settings.weeklyTargetHours * 60;
	const diff = weekTotal - target;

	const openEditor = (
		mode: "add" | "edit",
		date: string,
		entry?: TimeEntry,
	) => {
		setEditor({
			mode,
			entryId: entry?.id,
			date,
			startTime: entry?.startTime ?? "09:00",
			endTime: entry?.endTime ?? "17:00",
			breakMinutes: entry?.breakMinutes ?? 30,
		});
	};

	const closeEditor = () => setEditor(null);

	const saveEditor = async () => {
		if (!editor) return;
		if (editor.mode === "edit" && editor.entryId) {
			await updateTimeEntry({
				id: editor.entryId,
				date: editor.date,
				startTime: editor.startTime,
				endTime: editor.endTime,
				breakMinutes: editor.breakMinutes,
			});
		} else {
			await addTimeEntry({
				date: editor.date,
				startTime: editor.startTime,
				endTime: editor.endTime,
				breakMinutes: editor.breakMinutes,
			});
		}
		closeEditor();
		await loadEntries();
	};

	const deleteEditorEntry = async () => {
		if (!editor?.entryId) return;
		await deleteTimeEntry(editor.entryId);
		closeEditor();
		await loadEntries();
	};

	const editorDuration = editor
		? Math.max(
				0,
				calcDuration(
					editor.startTime,
					editor.endTime,
					editor.breakMinutes,
				),
			)
		: 0;

	// Group entries by date
	const grouped: Record<string, TimeEntry[]> = {};
	for (const e of entries) {
		(grouped[e.date] ??= []).push(e);
	}

	return (
		<div className="mx-auto flex max-w-md flex-col gap-4 pb-6">
			{/* Week navigation */}
			<div className="flex items-center justify-between">
				<button
					onClick={() => setWeekOffset(o => o - 1)}
					className="rounded-full p-2 active:bg-black/5 dark:active:bg-white/10 transition-colors">
					<ChevronLeft
						size={22}
						className="text-gray-600 dark:text-gray-300"
					/>
				</button>
				<div className="text-center">
					<p className="text-sm font-semibold text-gray-900 dark:text-white">
						KW {weekNum}
					</p>
					<p className="text-xs text-gray-500 dark:text-gray-400">
						{formatDateDisplay(weekDates[0])} –{" "}
						{formatDateDisplay(weekDates[6])}
					</p>
				</div>
				<button
					onClick={() => setWeekOffset(o => o + 1)}
					className="rounded-full p-2 active:bg-black/5 dark:active:bg-white/10 transition-colors">
					<ChevronRight
						size={22}
						className="text-gray-600 dark:text-gray-300"
					/>
				</button>
			</div>

			{/* Days */}
			{weekDates.map((date, i) => {
				const dateStr = formatDateISO(date);
				const dayKey = getDayKey(date);
				const active =
					settings.activeDays[
						dayKey as keyof typeof settings.activeDays
					];
				const dayEntries = grouped[dateStr] || [];
				const dayTotal = dayEntries.reduce(
					(sum, e) =>
						sum +
						calcDuration(e.startTime, e.endTime, e.breakMinutes),
					0,
				);
				const todayDay = isToday(dateStr);

				return (
					<GlassCard
						key={i}
						className={`p-4 ${!active ? "opacity-50" : ""}`}>
						<div className="mb-1 flex items-center justify-between">
							<span
								className={`text-[15px] font-semibold ${todayDay ? "text-blue-500" : "text-gray-900 dark:text-white"}`}>
								{formatDateDisplay(date)}
							</span>
							<div className="flex items-center gap-2">
								<span className="text-[15px] font-bold tabular-nums text-gray-900 dark:text-white">
									{dayTotal > 0
										? formatDuration(dayTotal)
										: "–"}
								</span>
								<button
									onClick={() => openEditor("add", dateStr)}
									className="rounded-full p-1 transition-colors active:bg-black/5 dark:active:bg-white/10"
									title="Eintrag hinzufügen">
									<Plus size={16} className="text-gray-400" />
								</button>
							</div>
						</div>

						{dayEntries.map(entry => (
							<div
								key={entry.id}
								className="mt-2 flex items-center justify-between rounded-xl bg-gray-100/80 px-3 py-2.5 dark:bg-white/[0.05]">
								<div>
									<span className="text-sm tabular-nums text-gray-700 dark:text-gray-300">
										{entry.startTime} – {entry.endTime}
									</span>
									{entry.breakMinutes > 0 && (
										<span className="ml-2 text-xs text-gray-400">
											({entry.breakMinutes}m Pause)
										</span>
									)}
								</div>
								<button
									onClick={() =>
										openEditor("edit", dateStr, entry)
									}
									className="rounded-full p-1.5 transition-colors active:bg-black/5 dark:active:bg-white/10">
									<Pencil
										size={14}
										className="text-gray-400"
									/>
								</button>
							</div>
						))}

						{dayEntries.length === 0 && active && (
							<p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
								Keine Einträge
							</p>
						)}
					</GlassCard>
				);
			})}

			{/* Week Summary */}
			<GlassCard className="p-4">
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium text-gray-500 dark:text-gray-400">
						Gesamt
					</span>
					<span className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">
						{formatDuration(weekTotal)}
					</span>
				</div>
				<div className="mt-1 flex items-center justify-between">
					<span className="text-sm text-gray-500 dark:text-gray-400">
						Soll: {formatDuration(target)}
					</span>
					<span
						className={`text-sm font-semibold tabular-nums ${
							diff >= 0
								? "text-green-600 dark:text-green-400"
								: "text-red-500"
						}`}>
						{diff >= 0 ? "+" : ""}
						{formatDuration(diff)}
					</span>
				</div>
			</GlassCard>

			{/* Full-screen editor */}
			{editor && (
				<div className="fixed inset-0 z-50 flex flex-col bg-[#f2f2f7] dark:bg-black animate-slide-up-full safe-top">
					<div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/80 dark:border-white/[0.08]">
						<button
							onClick={closeEditor}
							className="min-w-[80px] text-left text-[17px] text-blue-500">
							Abbrechen
						</button>
						<span className="text-[17px] font-semibold text-gray-900 dark:text-white">
							{editor.mode === "edit"
								? "Bearbeiten"
								: "Neuer Eintrag"}
						</span>
						<button
							onClick={saveEditor}
							className="min-w-[80px] text-right text-[17px] font-semibold text-blue-500">
							Sichern
						</button>
					</div>

					<div className="flex-1 overflow-y-auto px-4 pt-4 pb-8 safe-bottom">
						<p className="mb-4 px-1 text-sm text-gray-500 dark:text-gray-400">
							{formatDateDisplay(
								new Date(editor.date + "T00:00:00"),
							)}
						</p>

						<div className="mb-3 rounded-2xl bg-white p-4 dark:bg-[#1c1c1e]">
							<p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
								Startzeit
							</p>
							<TimePicker
								value={editor.startTime}
								onChange={v =>
									setEditor(e =>
										e ? { ...e, startTime: v } : e,
									)
								}
							/>
						</div>

						<div className="mb-3 rounded-2xl bg-white p-4 dark:bg-[#1c1c1e]">
							<p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
								Endzeit
							</p>
							<TimePicker
								value={editor.endTime}
								onChange={v =>
									setEditor(e =>
										e ? { ...e, endTime: v } : e,
									)
								}
							/>
						</div>

						<div className="mb-3 rounded-2xl bg-white p-4 dark:bg-[#1c1c1e]">
							<div className="flex items-center justify-between">
								<span className="text-[15px] text-gray-900 dark:text-white">
									Pause
								</span>
								<div className="flex items-center gap-4">
									<button
										onClick={() =>
											setEditor(e =>
												e
													? {
															...e,
															breakMinutes:
																Math.max(
																	0,
																	e.breakMinutes -
																		5,
																),
														}
													: e,
											)
										}
										className="rounded-full bg-gray-100 p-2 active:bg-gray-200 dark:bg-white/10 dark:active:bg-white/20">
										<Minus
											size={16}
											className="text-gray-600 dark:text-gray-300"
										/>
									</button>
									<span className="w-12 text-center text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
										{editor.breakMinutes}m
									</span>
									<button
										onClick={() =>
											setEditor(e =>
												e
													? {
															...e,
															breakMinutes:
																e.breakMinutes +
																5,
														}
													: e,
											)
										}
										className="rounded-full bg-gray-100 p-2 active:bg-gray-200 dark:bg-white/10 dark:active:bg-white/20">
										<Plus
											size={16}
											className="text-gray-600 dark:text-gray-300"
										/>
									</button>
								</div>
							</div>
						</div>

						<div className="mb-8 rounded-2xl bg-white p-4 dark:bg-[#1c1c1e]">
							<div className="flex items-center justify-between">
								<span className="text-[15px] text-gray-900 dark:text-white">
									Arbeitszeit
								</span>
								<span className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
									{formatDuration(editorDuration)}
								</span>
							</div>
						</div>

						{editor.mode === "edit" && (
							<button
								onClick={deleteEditorEntry}
								className="w-full rounded-2xl bg-white p-4 text-center text-[17px] text-red-500 active:bg-gray-50 dark:bg-[#1c1c1e] dark:active:bg-white/[0.08]">
								Eintrag löschen
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
