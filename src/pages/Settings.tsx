import { Sun, Moon, Monitor } from "lucide-react";
import GlassCard from "../components/GlassCard";
import { useSettings } from "../hooks/useSettingsContext";
import { dayNameShort, dayKeyFromIndex, type DayKey } from "../lib/dates";

const DAY_LABELS = Array.from({ length: 7 }, (_, i) => ({
	key: dayKeyFromIndex(i) as DayKey,
	label: dayNameShort(i),
}));

export default function Settings() {
	const { settings, updateSettings } = useSettings();

	const toggleDay = (key: DayKey) => {
		updateSettings({
			activeDays: {
				...settings.activeDays,
				[key]: !settings.activeDays[key],
			},
		});
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

			<p className="text-center text-xs text-gray-400 dark:text-gray-500">
				v1.0.0
			</p>
		</div>
	);
}
