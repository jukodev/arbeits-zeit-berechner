import { useState, useEffect, useCallback } from "react";
import {
	ChevronLeft,
	ChevronRight,
	Pencil,
	Check,
	X,
	Trash2,
	Plus,
} from "lucide-react";
import GlassCard from "../components/GlassCard";
import Modal from "../components/Modal";
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
	const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
	const [showConfirm, setShowConfirm] = useState(false);
	const [editForm, setEditForm] = useState({
		startTime: "",
		endTime: "",
		breakMinutes: 0,
	});

	// State for adding new entries
	const [addingDate, setAddingDate] = useState<string | null>(null);
	const [addForm, setAddForm] = useState({
		startTime: "09:00",
		endTime: "17:00",
		breakMinutes: 30,
	});

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

	const handleEditClick = (entry: TimeEntry) => {
		setEditEntry(entry);
		setShowConfirm(true);
	};

	const confirmEdit = () => {
		if (!editEntry) return;
		setEditForm({
			startTime: editEntry.startTime,
			endTime: editEntry.endTime,
			breakMinutes: editEntry.breakMinutes,
		});
		setShowConfirm(false);
	};

	const saveEdit = async () => {
		if (!editEntry?.id) return;
		await updateTimeEntry({
			...editEntry,
			startTime: editForm.startTime,
			endTime: editForm.endTime,
			breakMinutes: editForm.breakMinutes,
		});
		setEditEntry(null);
		await loadEntries();
	};

	const cancelEdit = () => {
		setEditEntry(null);
		setShowConfirm(false);
	};

	const handleDelete = async () => {
		if (!editEntry?.id) return;
		await deleteTimeEntry(editEntry.id);
		setEditEntry(null);
		await loadEntries();
	};

	const handleAddClick = (dateStr: string) => {
		setAddingDate(dateStr);
		setAddForm({ startTime: "09:00", endTime: "17:00", breakMinutes: 30 });
	};

	const saveAdd = async () => {
		if (!addingDate) return;
		await addTimeEntry({
			date: addingDate,
			startTime: addForm.startTime,
			endTime: addForm.endTime,
			breakMinutes: addForm.breakMinutes,
		});
		setAddingDate(null);
		await loadEntries();
	};

	const cancelAdd = () => {
		setAddingDate(null);
	};

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
				const isAdding = addingDate === dateStr;

				return (
					<GlassCard
						key={i}
						className={`p-4 ${!active ? "opacity-50" : ""} ${todayDay ? "ring-1 ring-blue-400/20" : ""}`}>
						<div className="mb-1 flex items-center justify-between">
							<span
								className={`text-sm font-semibold ${todayDay ? "text-blue-500" : "text-gray-900 dark:text-white"}`}>
								{formatDateDisplay(date)}
							</span>
							<div className="flex items-center gap-2">
								<span className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">
									{dayTotal > 0
										? formatDuration(dayTotal)
										: "–"}
								</span>
								{!isAdding && (
									<button
										onClick={() => handleAddClick(dateStr)}
										className="rounded-full p-1 transition-colors active:bg-black/5 dark:active:bg-white/10"
										title="Eintrag hinzufügen">
										<Plus
											size={16}
											className="text-gray-400"
										/>
									</button>
								)}
							</div>
						</div>

						{/* Existing entries */}
						{dayEntries.map(entry => {
							const isEditing =
								editEntry?.id === entry.id && !showConfirm;
							return (
								<div
									key={entry.id}
									className="mt-2 flex items-center justify-between rounded-2xl bg-black/[0.03] px-3 py-2 dark:bg-white/[0.05]">
									{isEditing ? (
										<div className="flex flex-1 flex-col gap-2">
											<div className="flex gap-2">
												<input
													type="time"
													value={editForm.startTime}
													onChange={e =>
														setEditForm(f => ({
															...f,
															startTime:
																e.target.value,
														}))
													}
													className="rounded-xl border border-black/10 bg-white/80 px-2 py-1 text-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.08] dark:text-white"
												/>
												<span className="self-center text-gray-400">
													–
												</span>
												<input
													type="time"
													value={editForm.endTime}
													onChange={e =>
														setEditForm(f => ({
															...f,
															endTime:
																e.target.value,
														}))
													}
													className="rounded-xl border border-black/10 bg-white/80 px-2 py-1 text-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.08] dark:text-white"
												/>
											</div>
											<div className="flex items-center gap-2">
												<span className="text-xs text-gray-500 dark:text-gray-400">
													Pause:
												</span>
												<input
													type="number"
													value={
														editForm.breakMinutes
													}
													onChange={e =>
														setEditForm(f => ({
															...f,
															breakMinutes:
																Math.max(
																	0,
																	Number(
																		e.target
																			.value,
																	),
																),
														}))
													}
													className="w-16 rounded-xl border border-black/10 bg-white/80 px-2 py-1 text-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.08] dark:text-white"
													min={0}
													step={1}
												/>
												<span className="text-xs text-gray-500 dark:text-gray-400">
													min
												</span>
											</div>
											<div className="flex gap-2">
												<button
													onClick={saveEdit}
													className="rounded-xl bg-green-500 px-3 py-1.5 text-xs font-medium text-white active:bg-green-600">
													<Check size={14} />
												</button>
												<button
													onClick={cancelEdit}
													className="rounded-xl bg-black/[0.04] px-3 py-1.5 text-xs font-medium text-gray-700 active:bg-black/[0.08] dark:bg-white/[0.08] dark:text-gray-300">
													<X size={14} />
												</button>
												<button
													onClick={handleDelete}
													className="ml-auto rounded-xl bg-red-500 px-3 py-1.5 text-xs font-medium text-white active:bg-red-600">
													<Trash2 size={14} />
												</button>
											</div>
										</div>
									) : (
										<>
											<div>
												<span className="text-sm tabular-nums text-gray-700 dark:text-gray-300">
													{entry.startTime} –{" "}
													{entry.endTime}
												</span>
												{entry.breakMinutes > 0 && (
													<span className="ml-2 text-xs text-gray-400">
														({entry.breakMinutes}m
														Pause)
													</span>
												)}
											</div>
											<button
												onClick={() =>
													handleEditClick(entry)
												}
												className="rounded-full p-1.5 transition-colors active:bg-black/5 dark:active:bg-white/10">
												<Pencil
													size={14}
													className="text-gray-400"
												/>
											</button>
										</>
									)}
								</div>
							);
						})}

						{/* Add new entry inline form */}
						{isAdding && (
							<div className="mt-2 flex flex-col gap-2 rounded-2xl bg-blue-500/[0.05] px-3 py-3 dark:bg-blue-400/[0.08]">
								<p className="text-xs font-medium text-blue-600 dark:text-blue-400">
									Neuer Eintrag
								</p>
								<div className="flex gap-2">
									<input
										type="time"
										value={addForm.startTime}
										onChange={e =>
											setAddForm(f => ({
												...f,
												startTime: e.target.value,
											}))
										}
										className="rounded-xl border border-black/10 bg-white/80 px-2 py-1 text-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.08] dark:text-white"
									/>
									<span className="self-center text-gray-400">
										–
									</span>
									<input
										type="time"
										value={addForm.endTime}
										onChange={e =>
											setAddForm(f => ({
												...f,
												endTime: e.target.value,
											}))
										}
										className="rounded-xl border border-black/10 bg-white/80 px-2 py-1 text-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.08] dark:text-white"
									/>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-xs text-gray-500 dark:text-gray-400">
										Pause:
									</span>
									<input
										type="number"
										value={addForm.breakMinutes}
										onChange={e =>
											setAddForm(f => ({
												...f,
												breakMinutes: Math.max(
													0,
													Number(e.target.value),
												),
											}))
										}
										className="w-16 rounded-xl border border-black/10 bg-white/80 px-2 py-1 text-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.08] dark:text-white"
										min={0}
										step={1}
									/>
									<span className="text-xs text-gray-500 dark:text-gray-400">
										min
									</span>
								</div>
								<div className="flex gap-2">
									<button
										onClick={saveAdd}
										className="rounded-xl bg-blue-500 px-3 py-1.5 text-xs font-medium text-white active:bg-blue-600">
										<Check size={14} />
									</button>
									<button
										onClick={cancelAdd}
										className="rounded-xl bg-black/[0.04] px-3 py-1.5 text-xs font-medium text-gray-700 active:bg-black/[0.08] dark:bg-white/[0.08] dark:text-gray-300">
										<X size={14} />
									</button>
								</div>
							</div>
						)}

						{dayEntries.length === 0 && !isAdding && active && (
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
							diff >= 0 ? "text-green-500" : "text-orange-500"
						}`}>
						{diff >= 0 ? "+" : ""}
						{formatDuration(diff)}
					</span>
				</div>
			</GlassCard>

			{/* Edit confirmation modal */}
			<Modal
				open={showConfirm}
				onClose={cancelEdit}
				title="Eintrag bearbeiten?"
				actions={
					<>
						<button
							onClick={cancelEdit}
							className="flex-1 rounded-2xl bg-black/[0.04] px-4 py-2.5 text-sm font-medium text-gray-700 active:bg-black/[0.08] dark:bg-white/[0.08] dark:text-gray-300 dark:active:bg-white/[0.12]">
							Abbrechen
						</button>
						<button
							onClick={confirmEdit}
							className="flex-1 rounded-2xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white active:bg-blue-600">
							Bearbeiten
						</button>
					</>
				}>
				<p className="text-sm text-gray-500 dark:text-gray-400">
					Möchtest du diesen Zeiteintrag bearbeiten?
				</p>
				{editEntry && (
					<p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
						{editEntry.startTime} – {editEntry.endTime}
						{editEntry.breakMinutes > 0 &&
							` (${editEntry.breakMinutes}m Pause)`}
					</p>
				)}
			</Modal>
		</div>
	);
}
