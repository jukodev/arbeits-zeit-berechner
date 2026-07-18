import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type CSSProperties,
	type PointerEvent as ReactPointerEvent,
	type MouseEvent as ReactMouseEvent,
} from "react";
import { CalendarDays, Home, Settings } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

const tabs = [
	{ to: "/", label: "Home", Icon: Home },
	{ to: "/history", label: "Verlauf", Icon: CalendarDays },
	{ to: "/settings", label: "Einstellungen", Icon: Settings },
] as const;

interface DragState {
	pointerId: number;
	startPointerX: number;
	startLensX: number;
	lastPointerX: number;
	lastTime: number;
	velocity: number;
	trackWidth: number;
	slotWidth: number;
	moved: boolean;
	previewIndex: number;
}

const DRAG_THRESHOLD = 4;

export default function LiquidGlassNav() {
	const location = useLocation();
	const navigate = useNavigate();
	const navRef = useRef<HTMLElement>(null);
	const dragRef = useRef<DragState | null>(null);
	const frameRef = useRef<number>(0);
	const suppressClickUntilRef = useRef(0);
	const [isDragging, setIsDragging] = useState(false);
	const [isMoving, setIsMoving] = useState(false);
	const [previewIndex, setPreviewIndex] = useState(0);

	const activeIndex = Math.max(
		0,
		tabs.findIndex(tab => tab.to === location.pathname),
	);

	const setLensTransform = useCallback(
		(x: number, stretch = 1, skew = 0) => {
			const nav = navRef.current;
			if (!nav) return;
			nav.style.setProperty("--glass-x", `${x}px`);
			nav.style.setProperty("--glass-stretch", stretch.toFixed(3));
			nav.style.setProperty("--glass-skew", `${skew.toFixed(2)}deg`);
		},
		[],
	);

	const placeLensAt = useCallback(
		(index: number) => {
			const nav = navRef.current;
			if (!nav) return;
			const slotWidth = nav.getBoundingClientRect().width / tabs.length;
			setLensTransform(3 + index * slotWidth);
		},
		[setLensTransform],
	);

	useLayoutEffect(() => {
		if (!dragRef.current) placeLensAt(activeIndex);
		setPreviewIndex(activeIndex);
	}, [activeIndex, placeLensAt]);

	useEffect(() => {
		const nav = navRef.current;
		if (!nav) return;
		const observer = new ResizeObserver(() => {
			if (!dragRef.current) placeLensAt(activeIndex);
		});
		observer.observe(nav);
		return () => observer.disconnect();
	}, [activeIndex, placeLensAt]);

	useEffect(
		() => () => {
			cancelAnimationFrame(frameRef.current);
		},
		[],
	);

	const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
		if (event.button !== 0) return;
		const pressedItem = (event.target as Element).closest<HTMLElement>(
			"[data-tab-index]",
		);
		if (!pressedItem) return;

		const pressedIndex = Number(pressedItem.dataset.tabIndex);
		if (!Number.isInteger(pressedIndex) || !tabs[pressedIndex]) return;

		if (pressedIndex !== activeIndex) {
			suppressClickUntilRef.current = Date.now() + 1500;
			navigate(tabs[pressedIndex].to, { flushSync: true });
			return;
		}

		const nav = navRef.current;
		if (!nav) return;
		const trackWidth = nav.getBoundingClientRect().width;
		const slotWidth = trackWidth / tabs.length;
		const startLensX = 3 + activeIndex * slotWidth;

		nav.setPointerCapture(event.pointerId);
		dragRef.current = {
			pointerId: event.pointerId,
			startPointerX: event.clientX,
			startLensX,
			lastPointerX: event.clientX,
			lastTime: event.timeStamp,
			velocity: 0,
			trackWidth,
			slotWidth,
			moved: false,
			previewIndex: activeIndex,
		};
		setPreviewIndex(activeIndex);
		setIsDragging(true);
	};

	const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
		const drag = dragRef.current;
		if (!drag || drag.pointerId !== event.pointerId) return;

		const deltaFromStart = event.clientX - drag.startPointerX;
		if (!drag.moved && Math.abs(deltaFromStart) >= DRAG_THRESHOLD) {
			drag.moved = true;
			setIsMoving(true);
		}

		const minX = 3;
		const maxX = drag.trackWidth - drag.slotWidth + 3;
		const x = Math.max(
			minX,
			Math.min(maxX, drag.startLensX + deltaFromStart),
		);
		const elapsedMs = Math.max(1, event.timeStamp - drag.lastTime);
		const instantVelocity = (event.clientX - drag.lastPointerX) / elapsedMs;
		drag.velocity = drag.velocity * 0.62 + instantVelocity * 0.38;
		drag.lastPointerX = event.clientX;
		drag.lastTime = event.timeStamp;

		const nextPreview = Math.max(
			0,
			Math.min(tabs.length - 1, Math.round((x - 3) / drag.slotWidth)),
		);
		if (nextPreview !== drag.previewIndex) {
			drag.previewIndex = nextPreview;
			setPreviewIndex(nextPreview);
			if (event.pointerType === "touch" && "vibrate" in navigator) {
				navigator.vibrate(7);
			}
		}

		const edgeDistance = Math.min(x - minX, maxX - x);
		const edgeFactor = Math.min(1, Math.max(0, edgeDistance / 12));
		const stretch =
			1 + Math.min(Math.abs(drag.velocity) * 0.055, 0.085) * edgeFactor;
		const skew =
			Math.max(-2.2, Math.min(2.2, drag.velocity * 1.35)) * edgeFactor;

		cancelAnimationFrame(frameRef.current);
		frameRef.current = requestAnimationFrame(() => {
			setLensTransform(x, stretch, skew);
		});
	};

	const finishPointer = (
		event: ReactPointerEvent<HTMLElement>,
		cancelled: boolean,
	) => {
		const drag = dragRef.current;
		if (!drag || drag.pointerId !== event.pointerId) return;

		cancelAnimationFrame(frameRef.current);
		const targetIndex = cancelled ? activeIndex : drag.previewIndex;
		if (!cancelled && drag.moved && targetIndex !== activeIndex) {
			suppressClickUntilRef.current = Date.now() + 1500;
			navigate(tabs[targetIndex].to, { flushSync: true });
		}

		dragRef.current = null;
		setIsDragging(false);
		setIsMoving(false);
		if (navRef.current?.hasPointerCapture(event.pointerId)) {
			navRef.current.releasePointerCapture(event.pointerId);
		}
		placeLensAt(targetIndex);
	};

	const handleClick = (event: ReactMouseEvent<HTMLElement>) => {
		const item = (event.target as Element).closest<HTMLElement>(
			"[data-tab-index]",
		);
		if (!item) return;
		const clickedIndex = Number(item.dataset.tabIndex);
		if (
			Date.now() < suppressClickUntilRef.current ||
			clickedIndex === activeIndex
		) {
			event.preventDefault();
		}
	};

	return (
		<div className="liquid-glass-nav-shell">
			<nav
				ref={navRef}
				className="liquid-glass-nav"
				aria-label="Primary navigation"
				data-dragging={isDragging ? "true" : "false"}
				data-moving={isMoving ? "true" : "false"}
				style={{ "--tab-count": tabs.length } as CSSProperties}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={event => finishPointer(event, false)}
				onPointerCancel={event => finishPointer(event, true)}
				onClickCapture={handleClick}>
				<span className="liquid-glass-nav__backplate" aria-hidden="true" />
				<span className="liquid-glass-nav__lens" aria-hidden="true" />

				{tabs.map(({ to, label, Icon }, index) => {
					const selected = isDragging
						? previewIndex === index
						: activeIndex === index;
					return (
						<NavLink
							key={to}
							to={to}
							end={to === "/"}
							data-tab-index={index}
							data-selected={selected ? "true" : "false"}
							aria-current={activeIndex === index ? "page" : undefined}
							className="liquid-glass-nav__item"
							draggable={false}>
							<Icon aria-hidden="true" size={22} strokeWidth={2.15} />
							<span>{label}</span>
						</NavLink>
					);
				})}
			</nav>
		</div>
	);
}
