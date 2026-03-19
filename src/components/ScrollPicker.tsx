import { useRef, useEffect, useCallback } from "react";

interface ScrollPickerProps {
	items: string[];
	selectedIndex: number;
	onChange: (index: number) => void;
	width?: number;
}

const ITEM_HEIGHT = 50;
const PADDING_ITEMS = 1; // extra blank items top/bottom so first/last can center

export default function ScrollPicker({
	items,
	selectedIndex,
	onChange,
	width = 70,
}: ScrollPickerProps) {
	const trackRef = useRef<HTMLDivElement>(null);
	const isUserScroll = useRef(true);
	const rafRef = useRef<number>(0);
	const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

	const scrollToIndex = useCallback((idx: number, smooth = true) => {
		const el = trackRef.current;
		if (!el) return;
		isUserScroll.current = false;
		el.scrollTo({
			top: idx * ITEM_HEIGHT,
			behavior: smooth ? "smooth" : "instant",
		});
		// Re-enable user scroll detection after animation
		setTimeout(
			() => {
				isUserScroll.current = true;
			},
			smooth ? 200 : 50,
		);
	}, []);

	// Initial scroll
	useEffect(() => {
		scrollToIndex(selectedIndex, false);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// Sync when parent changes selectedIndex
	useEffect(() => {
		if (!isUserScroll.current) return;
		const el = trackRef.current;
		if (!el) return;
		const currentIdx = Math.round(el.scrollTop / ITEM_HEIGHT);
		if (currentIdx !== selectedIndex) {
			scrollToIndex(selectedIndex, true);
		}
	}, [selectedIndex, scrollToIndex]);

	const handleScroll = useCallback(() => {
		if (!isUserScroll.current) return;
		const el = trackRef.current;
		if (!el) return;

		cancelAnimationFrame(rafRef.current);
		clearTimeout(settleTimer.current);

		settleTimer.current = setTimeout(() => {
			rafRef.current = requestAnimationFrame(() => {
				const idx = Math.round(el.scrollTop / ITEM_HEIGHT);
				const clamped = Math.max(0, Math.min(idx, items.length - 1));
				if (clamped !== selectedIndex) {
					onChange(clamped);
				}
			});
		}, 60);
	}, [items.length, onChange, selectedIndex]);

	return (
		<div className="scroll-picker" style={{ width }}>
			{/* Selection highlight band */}
			<div className="scroll-picker-highlight bg-black/[0.04] dark:bg-white/[0.08]" />

			<div
				ref={trackRef}
				className="scroll-picker-track"
				onScroll={handleScroll}>
				{/* Top padding */}
				{Array.from({ length: PADDING_ITEMS }).map((_, i) => (
					<div key={`pad-top-${i}`} style={{ height: ITEM_HEIGHT }} />
				))}

				{items.map((item, i) => (
					<div
						key={i}
						className="scroll-picker-item"
						data-selected={i === selectedIndex}>
						{item}
					</div>
				))}

				{/* Bottom padding */}
				{Array.from({ length: PADDING_ITEMS }).map((_, i) => (
					<div key={`pad-bot-${i}`} style={{ height: ITEM_HEIGHT }} />
				))}
			</div>
		</div>
	);
}
