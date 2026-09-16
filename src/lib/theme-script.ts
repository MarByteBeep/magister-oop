import { destructiveColor, destructiveForegroundColor } from '@/lib/colors';
import { applyThemePreference, getStoredTheme } from '@/lib/themePreference';

document.documentElement.style.setProperty('--destructive', destructiveColor);
document.documentElement.style.setProperty('--destructive-foreground', destructiveForegroundColor);

// This script runs before the React app mounts so the initial theme is
// applied as early as possible based on stored user preference.
void (async () => {
	const theme = await getStoredTheme();
	applyThemePreference(theme);
})();
