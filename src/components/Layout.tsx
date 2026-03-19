import { Outlet, NavLink } from "react-router-dom";
import { Home, CalendarDays, Settings } from "lucide-react";

const navItems = [
	{ to: "/", label: "Home", Icon: Home },
	{ to: "/history", label: "Verlauf", Icon: CalendarDays },
	{ to: "/settings", label: "Einstellungen", Icon: Settings },
] as const;

export default function Layout() {
	return (
		<div className="flex h-full flex-col bg-[#f2f2f7] dark:bg-black safe-top safe-x">
			{/* Page content */}
			<main className="flex-1 overflow-y-auto overscroll-none px-4 pt-4 pb-24">
				<Outlet />
			</main>

			{/* Tab bar */}
			<nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-300/60 bg-[#f2f2f7]/80 backdrop-blur-xl dark:border-white/[0.08] dark:bg-black/80">
				<ul className="mx-auto flex max-w-md justify-around">
					{navItems.map(({ to, label, Icon }) => (
						<li key={to}>
							<NavLink
								to={to}
								end={to === "/"}
								className={({ isActive }) =>
									`flex flex-col items-center px-4 py-2.5 text-[10px] font-medium transition-colors ${
										isActive
											? "text-blue-500"
											: "text-gray-400 active:text-gray-600 dark:text-gray-500 dark:active:text-gray-300"
									}`
								}>
								<Icon size={22} strokeWidth={1.5} />
								<span className="mt-0.5">{label}</span>
							</NavLink>
						</li>
					))}
				</ul>
			</nav>
		</div>
	);
}
