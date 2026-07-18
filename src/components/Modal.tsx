import { type ReactNode, useEffect, useId } from "react";
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
	const titleId = useId();

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
		<div className="fixed inset-0 z-50 flex items-end justify-center px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:items-center">
			<div
				className="absolute inset-0 bg-black/25 backdrop-blur-sm dark:bg-black/45"
				onClick={onClose}
			/>

			<div
				className="ios-glass-sheet relative w-full max-w-sm overflow-hidden rounded-3xl animate-slide-up"
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}>
				<div className="flex items-center justify-between px-5 pt-5 pb-2">
					<h3
						id={titleId}
						className="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white">
						{title}
					</h3>
					<button
						onClick={onClose}
						aria-label="SchlieÃŸen"
						className="ios-glass-control grid h-8 w-8 place-items-center rounded-full text-gray-500 dark:text-gray-400">
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
