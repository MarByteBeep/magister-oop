import { sendRuntimeMessage } from '@/lib/extension/runtimeMessage';
import { destructiveColor, destructiveForegroundColor } from '@/lib/theme/colors';

export function formatActionBadgeText(count: number): string {
	if (count <= 0) return '';
	if (count > 99) return '99+';
	return String(count);
}

function extensionApi(): typeof chrome | undefined {
	return globalThis.chrome;
}

export function syncActionBadge(count: number): void {
	sendRuntimeMessage({
		type: 'syncActionBadge',
		text: formatActionBadgeText(count),
	});
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
