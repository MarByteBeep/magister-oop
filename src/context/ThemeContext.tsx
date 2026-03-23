'use client';

import { createContext, type ReactNode, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { applyThemePreference, getStoredTheme, setStoredTheme, type ThemePreference } from '@/lib/themePreference';

type ThemeContextValue = {
	theme: ThemePreference;
	setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<ThemePreference>('system');

	useLayoutEffect(() => {
		let cancelled = false;
		void (async () => {
			const storedTheme = await getStoredTheme();
			if (cancelled) return;
			setThemeState(storedTheme);
			applyThemePreference(storedTheme);
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const setTheme = useCallback((nextTheme: ThemePreference) => {
		setThemeState(nextTheme);
		applyThemePreference(nextTheme);
		// Na paint: voorkomt dat chrome.storage / console het klikken blokkeert.
		requestAnimationFrame(() => {
			void setStoredTheme(nextTheme);
		});
	}, []);

	const value = useMemo(
		() => ({
			theme,
			setTheme,
		}),
		[theme, setTheme],
	);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useTheme must be used inside ThemeProvider');
	}
	return context;
}
