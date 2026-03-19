import { useMemo } from "react";
import ScrollPicker from "./ScrollPicker";

const HOURS = Array.from({ length: 24 }, (_, i) =>
	i.toString().padStart(2, "0"),
);
const MINUTES = Array.from({ length: 60 }, (_, i) =>
	i.toString().padStart(2, "0"),
);

interface TimePickerProps {
	value: string; // "HH:mm"
	onChange: (value: string) => void;
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
	const [hourStr, minStr] = value.split(":");
	const hourIdx = parseInt(hourStr, 10) || 0;
	const minIdx = parseInt(minStr, 10) || 0;

	const handleHourChange = useMemo(
		() => (idx: number) => {
			const h = idx.toString().padStart(2, "0");
			const m = minIdx.toString().padStart(2, "0");
			onChange(`${h}:${m}`);
		},
		[minIdx, onChange],
	);

	const handleMinChange = useMemo(
		() => (idx: number) => {
			const h = hourIdx.toString().padStart(2, "0");
			const m = idx.toString().padStart(2, "0");
			onChange(`${h}:${m}`);
		},
		[hourIdx, onChange],
	);

	return (
		<div className="flex items-center justify-center gap-0">
			<ScrollPicker
				items={HOURS}
				selectedIndex={hourIdx}
				onChange={handleHourChange}
				width={64}
				wrap
			/>
			<span className="text-2xl font-bold text-gray-900 dark:text-white select-none px-1">
				:
			</span>
			<ScrollPicker
				items={MINUTES}
				selectedIndex={minIdx}
				onChange={handleMinChange}
				width={64}
				wrap
			/>
		</div>
	);
}
