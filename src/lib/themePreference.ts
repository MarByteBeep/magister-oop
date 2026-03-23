'use client';

import { storage } from '@/lib/storage';

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'themePreference';
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

let systemMediaQuery: MediaQueryList | null = null;
let systemMediaListener: ((event: MediaQueryListEvent) => void) | null = null;

export function isThemePreference(value: string | undefined): value is ThemePreference {
	return value === 'light' || value === 'dark' || value === 'system';
}

function applyResolvedDarkClass(isDark: boolean) {
	if (isDark) {
		document.documentElement.classList.add('dark');
		return;
	}

	document.documentElement.classList.remove('dark');
}

function stopSystemThemeListener() {
	if (systemMediaQuery && systemMediaListener) {
		systemMediaQuery.removeEventListener('change', systemMediaListener);
	}
	systemMediaQuery = null;
	systemMediaListener = null;
}

function startSystemThemeListener() {
	if (systemMediaQuery && systemMediaListener) return;

	systemMediaQuery = window.matchMedia(DARK_MEDIA_QUERY);
	systemMediaListener = (event) => {
		applyResolvedDarkClass(event.matches);
	};
	systemMediaQuery.addEventListener('change', systemMediaListener);
}

export async function getStoredTheme(): Promise<ThemePreference> {
	const stored = await storage.local.get<string>(THEME_STORAGE_KEY);
	if (isThemePreference(stored)) return stored;
	return 'system';
}

export async function setStoredTheme(theme: ThemePreference): Promise<void> {
	await storage.local.set(THEME_STORAGE_KEY, theme);
}

export function applyThemePreference(theme: ThemePreference) {
	if (theme === 'dark') {
		stopSystemThemeListener();
		applyResolvedDarkClass(true);
		return;
	}

	if (theme === 'light') {
		stopSystemThemeListener();
		applyResolvedDarkClass(false);
		return;
	}

	startSystemThemeListener();
	applyResolvedDarkClass(window.matchMedia(DARK_MEDIA_QUERY).matches);
}
