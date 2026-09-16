import { destructiveColor, destructiveForegroundColor } from '@/lib/colors';

export function formatActionBadgeText(count: number): string {
	if (count <= 0) return '';
	if (count > 99) return '99+';
	return String(count);
}

function extensionApi(): typeof chrome | undefined {
	return globalThis.chrome;
}

export function syncActionBadge(count: number): void {
	try {
		const sendMessage = extensionApi()?.runtime?.sendMessage;
		if (typeof sendMessage !== 'function') return;
		sendMessage({ type: 'syncActionBadge', text: formatActionBadgeText(count) });
	} catch {
		// Extension APIs are unavailable outside the extension context.
	}
}

export async function applyActionBadgeText(text: string): Promise<void> {
	try {
		const action = extensionApi()?.action;
		if (!action?.setBadgeText) return;

		await action.setBadgeText({ text });
		if (text) {
			await action.setBadgeBackgroundColor({ color: destructiveColor });
			await action.setBadgeTextColor({ color: destructiveForegroundColor });
		}
	} catch {
		// Extension APIs are unavailable outside the extension context.
	}
}
