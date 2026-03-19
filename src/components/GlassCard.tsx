import { type ReactNode } from "react";

interface GlassCardProps {
	children: ReactNode;
	className?: string;
	onClick?: () => void;
}

export default function GlassCard({
	children,
	className = "",
	onClick,
}: GlassCardProps) {
	return (
		<div
			onClick={onClick}
			className={`rounded-3xl border border-white/20 bg-white/45 shadow-[0_2px_24px_-4px_rgba(0,0,0,0.08)] backdrop-blur-2xl
        dark:border-white/[0.08] dark:bg-white/[0.06] dark:shadow-[0_2px_24px_-4px_rgba(0,0,0,0.3)]
        ${onClick ? "cursor-pointer active:scale-[0.98] transition-transform" : ""}
        ${className}`}>
			{children}
		</div>
	);
}
