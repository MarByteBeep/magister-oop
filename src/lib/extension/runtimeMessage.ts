/** Fire-and-forget message to the background service worker; a no-op outside the extension. */
export function sendRuntimeMessage(message: { type: string } & Record<string, unknown>): void {
	try {
		const sendMessage = globalThis.chrome?.runtime?.sendMessage;
		if (typeof sendMessage !== 'function') return;
		void Promise.resolve(sendMessage(message)).catch(() => {
			// The background may not answer; nothing to recover.
		});
	} catch {
		// Extension APIs are unavailable outside the extension context.
	}
}
