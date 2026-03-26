import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
	open: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
	actions?: ReactNode;
}

export default function Modal({
	open,
	onClose,
	title,
	children,
	actions,
}: ModalProps) {
	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pt-4 pb-24 sm:pb-4">
			<div
				className="absolute inset-0 bg-black/25 backdrop-blur-xl"
				onClick={onClose}
			/>

			<div className="relative w-full max-w-sm rounded-3xl border border-white/40 bg-white/70 shadow-2xl shadow-black/10 backdrop-blur-2xl backdrop-saturate-150 dark:border-white/12 dark:bg-[#1c1c1e]/75 dark:shadow-black/30 animate-slide-up overflow-hidden">
				<div className="flex items-center justify-between px-5 pt-5 pb-2">
					<h3 className="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white">
						{title}
					</h3>
					<button
						onClick={onClose}
						className="grid h-7.5 w-7.5 place-items-center rounded-full bg-black/6 text-gray-400 active:bg-black/10 dark:bg-white/10 dark:text-gray-500 dark:active:bg-white/16 transition-colors">
						<X size={16} strokeWidth={2.5} />
					</button>
				</div>

				<div className="mx-5 h-px bg-black/6 dark:bg-white/8" />

				<div className="px-5 py-4">{children}</div>

				{actions && (
					<div className="flex gap-3 px-5 pb-5 pt-1">{actions}</div>
				)}
			</div>
		</div>
	);
}
