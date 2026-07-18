import { Outlet } from "react-router-dom";
import LiquidGlassNav from "./LiquidGlassNav";

export default function Layout() {
	return (
		<div className="app-shell flex h-full flex-col bg-[#f2f2f7] dark:bg-black safe-top safe-x">
			<main className="ios-scroll w-full min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-28">
				<Outlet />
			</main>
			<LiquidGlassNav />
		</div>
	);
}
