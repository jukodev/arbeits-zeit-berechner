import {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	type ReactNode,
} from "react";
import { getSettings, saveSettings } from "../db/settings";
import { type Settings, DEFAULT_SETTINGS } from "../db/database";

interface SettingsContextValue {
	settings: Settings;
	updateSettings: (patch: Partial<Settings>) => Promise<void>;
	loading: boolean;
}

const SettingsContext = createContext<SettingsContextValue>({
	settings: DEFAULT_SETTINGS,
	updateSettings: async () => {},
	loading: true,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
	const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getSettings().then(s => {
			setSettings(s);
			setLoading(false);
		});
	}, []);

	useEffect(() => {
		const root = document.documentElement;
		if (settings.theme === "dark") {
			root.classList.add("dark");
			root.classList.remove("light");
		} else if (settings.theme === "light") {
			root.classList.add("light");
			root.classList.remove("dark");
		} else {
			const prefersDark = window.matchMedia(
				"(prefers-color-scheme: dark)",
			).matches;
			root.classList.toggle("dark", prefersDark);
			root.classList.toggle("light", !prefersDark);
		}
	}, [settings.theme]);

	const updateSettings = useCallback(async (patch: Partial<Settings>) => {
		setSettings(prev => {
			const next = { ...prev, ...patch, key: "settings" } as Settings;
			saveSettings(next);
			return next;
		});
	}, []);

	return (
		<SettingsContext.Provider value={{ settings, updateSettings, loading }}>
			{children}
		</SettingsContext.Provider>
	);
}

export function useSettings() {
	return useContext(SettingsContext);
}
