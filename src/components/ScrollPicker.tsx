import { useRef, useEffect, useCallback } from "react";

interface ScrollPickerProps {
	items: string[];
	selectedIndex: number;
	onChange: (index: number) => void;
	width?: number;
	wrap?: boolean;
}

const ITEM_HEIGHT = 50;
const PADDING_ITEMS = 1;
const REPEATS = 3; // render items 3x for infinite scroll illusion

export default function ScrollPicker({
	items,
	selectedIndex,
	onChange,
	width = 70,
	wrap = false,
}: ScrollPickerProps) {
	const trackRef = useRef<HTMLDivElement>(null);
	const isUserScroll = useRef(true);
	const rafRef = useRef<number>(0);
	const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const count = items.length;
	const centerOffset = wrap ? count : 0; // start in the middle copy

	const scrollToIndex = useCallback((idx: number, smooth = true) => {
		const el = trackRef.current;
		if (!el) return;
		isUserScroll.current = false;
		el.scrollTo({
			top: idx * ITEM_HEIGHT,
			behavior: smooth ? "smooth" : "instant",
		});
		setTimeout(
			() => {
				isUserScroll.current = true;
			},
			smooth ? 200 : 50,
		);
	}, []);

	// Initial scroll
	useEffect(() => {
		scrollToIndex(centerOffset + selectedIndex, false);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// Sync when parent changes selectedIndex
	useEffect(() => {
		if (!isUserScroll.current) return;
		const el = trackRef.current;
		if (!el) return;
		const currentRaw = Math.round(el.scrollTop / ITEM_HEIGHT);
		const currentReal = wrap
			? ((currentRaw % count) + count) % count
			: currentRaw;
		if (currentReal !== selectedIndex) {
			scrollToIndex(centerOffset + selectedIndex, true);
		}
	}, [selectedIndex, scrollToIndex, centerOffset, count, wrap]);

	const handleScroll = useCallback(() => {
		if (!isUserScroll.current) return;
		const el = trackRef.current;
		if (!el) return;

		cancelAnimationFrame(rafRef.current);
		clearTimeout(settleTimer.current);

		settleTimer.current = setTimeout(() => {
			rafRef.current = requestAnimationFrame(() => {
				const rawIdx = Math.round(el.scrollTop / ITEM_HEIGHT);

				if (wrap) {
					const realIdx = ((rawIdx % count) + count) % count;
					// Re-center to middle copy silently
					const centeredIdx = centerOffset + realIdx;
					if (rawIdx !== centeredIdx) {
						isUserScroll.current = false;
						el.scrollTo({
							top: centeredIdx * ITEM_HEIGHT,
							behavior: "instant",
						});
						setTimeout(() => {
							isUserScroll.current = true;
						}, 30);
					}
					if (realIdx !== selectedIndex) {
						onChange(realIdx);
					}
				} else {
					const clamped = Math.max(0, Math.min(rawIdx, count - 1));
					if (clamped !== selectedIndex) {
						onChange(clamped);
					}
				}
			});
		}, 45);
	}, [count, onChange, selectedIndex, wrap, centerOffset]);

	const virtualItems = wrap
		? Array.from({ length: REPEATS }, () => items).flat()
		: items;

	return (
		<div className="scroll-picker" style={{ width }}>
			<div className="scroll-picker-highlight bg-black/[0.04] dark:bg-white/[0.08]" />

			<div
				ref={trackRef}
				className="scroll-picker-track"
				onScroll={handleScroll}>
				{/* Top padding */}
				{Array.from({ length: PADDING_ITEMS }).map((_, i) => (
					<div key={`pad-top-${i}`} style={{ height: ITEM_HEIGHT }} />
				))}

				{virtualItems.map((item, i) => {
					const realIdx = wrap ? i % count : i;
					return (
						<div
							key={i}
							className="scroll-picker-item"
							data-selected={realIdx === selectedIndex}>
							{item}
						</div>
					);
				})}

				{/* Bottom padding */}
				{Array.from({ length: PADDING_ITEMS }).map((_, i) => (
					<div key={`pad-bot-${i}`} style={{ height: ITEM_HEIGHT }} />
				))}
			</div>
		</div>
	);
}
