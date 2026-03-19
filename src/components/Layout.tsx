import { Outlet, NavLink } from "react-router-dom";
import { Home, CalendarDays, Settings } from "lucide-react";

const navItems = [
	{ to: "/", label: "Home", Icon: Home },
	{ to: "/history", label: "Verlauf", Icon: CalendarDays },
	{ to: "/settings", label: "Einstellungen", Icon: Settings },
] as const;

export default function Layout() {
	return (
		<div className="flex min-h-svh flex-col bg-gradient-to-b from-sky-100/80 via-blue-50/40 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 safe-top safe-x">
			{/* Page content */}
			<main className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
				<Outlet />
			</main>

			{/* iOS 26 liquid glass tab bar */}
			<nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/30 bg-white/50 backdrop-blur-3xl backdrop-saturate-150 dark:border-white/[0.06] dark:bg-gray-950/60">
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
