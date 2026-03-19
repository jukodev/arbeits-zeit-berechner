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
		<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/30 backdrop-blur-md"
				onClick={onClose}
			/>

			{/* Sheet */}
			<div className="relative w-full max-w-sm rounded-3xl border border-white/25 bg-white/70 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.12)] backdrop-blur-3xl backdrop-saturate-150 dark:bg-gray-900/80 dark:border-white/[0.08] dark:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.5)] animate-slide-up">
				{/* Header */}
				<div className="flex items-center justify-between px-5 pt-5 pb-2">
					<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
						{title}
					</h3>
					<button
						onClick={onClose}
						className="rounded-full p-1.5 text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
						<X size={20} />
					</button>
				</div>

				{/* Content */}
				<div className="px-5 py-3">{children}</div>

				{/* Actions */}
				{actions && (
					<div className="flex gap-3 px-5 pb-5 pt-2">{actions}</div>
				)}
			</div>
		</div>
	);
}
