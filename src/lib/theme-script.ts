import { applyThemePreference, getStoredTheme } from '@/lib/themePreference';

// This script runs before the React app mounts so the initial theme is
// applied as early as possible based on stored user preference.
void (async () => {
	const theme = await getStoredTheme();
	applyThemePreference(theme);
})();
