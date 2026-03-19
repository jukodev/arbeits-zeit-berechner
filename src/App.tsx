import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import History from "./pages/History";
import { SettingsProvider } from "./hooks/useSettingsContext";

export default function App() {
	return (
		<SettingsProvider>
			<Routes>
				<Route element={<Layout />}>
					<Route index element={<Home />} />
					<Route path="history" element={<History />} />
					<Route path="settings" element={<Settings />} />
				</Route>
			</Routes>
		</SettingsProvider>
	);
}
