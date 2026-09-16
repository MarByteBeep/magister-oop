import { destructiveColor, destructiveForegroundColor } from '@/lib/colors';

export function formatActionBadgeText(count: number): string {
	if (count <= 0) return '';
	if (count > 99) return '99+';
	return String(count);
}

function hasChromeActionApi(): boolean {
	return typeof chrome !== 'undefined' && !!chrome.action?.setBadgeText;
}

function hasChromeRuntimeMessaging(): boolean {
	return typeof chrome !== 'undefined' && !!chrome.runtime?.sendMessage;
}

export function syncActionBadge(count: number): void {
	if (!hasChromeRuntimeMessaging()) return;

	const text = formatActionBadgeText(count);
	chrome.runtime.sendMessage({ type: 'syncActionBadge', text });
}

export async function applyActionBadgeText(text: string): Promise<void> {
	if (!hasChromeActionApi()) return;

	await chrome.action.setBadgeText({ text });
	if (text) {
		await chrome.action.setBadgeBackgroundColor({ color: destructiveColor });
		await chrome.action.setBadgeTextColor({ color: destructiveForegroundColor });
	}
}
