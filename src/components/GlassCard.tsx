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
			className={`rounded-2xl bg-white dark:bg-[#1c1c1e]
        ${onClick ? "cursor-pointer active:scale-[0.98] transition-transform" : ""}
        ${className}`}>
			{children}
		</div>
	);
}
