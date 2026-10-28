/** Shown when Magister returns 404 (session cookies invalid or expired). */
export const MAGISTER_SESSION_EXPIRED_MESSAGE =
	'De Magister-sessie is ongeldig of verlopen. ' +
	'Log opnieuw in in de Magister-tab; de gegevens verschijnen daarna automatisch.';

/** Shown when the Magister tab holds no OIDC access token for the platform APIs. */
export const MAGISTER_TOKEN_MISSING_MESSAGE =
	'Geen Magister-token gevonden in de geopende Magister-tab. ' +
	'Ververs de Magister-tab en open daarna deze extensie opnieuw.';

/** Shown when no signed-in school tab can run the request (closed, reloading, or navigated away). */
export const MAGISTER_TAB_UNAVAILABLE_MESSAGE =
	'Geen bereikbare Magister-tab. ' +
	'Log in op Magister in een browsertab; de gegevens verschijnen daarna automatisch.';

const MAGISTER_UNAVAILABLE_MESSAGES = new Set([
	MAGISTER_SESSION_EXPIRED_MESSAGE,
	MAGISTER_TOKEN_MISSING_MESSAGE,
	MAGISTER_TAB_UNAVAILABLE_MESSAGE,
]);

/** True for errors the session gate already handles; callers should not log them as failures. */
export function isMagisterUnavailableError(error: unknown): boolean {
	const message = error instanceof Error ? error.message : error;
	return typeof message === 'string' && MAGISTER_UNAVAILABLE_MESSAGES.has(message);
}
