/** Shown when Magister returns 404 (session cookies invalid or expired). */
export const MAGISTER_SESSION_EXPIRED_MESSAGE =
	'De Magister-sessie is ongeldig of verlopen. ' +
	'Log opnieuw in op Magister in een browsertab en open daarna deze extensie opnieuw.';

export function schoolApiHttpErrorMessage(status: number): string {
	if (status === 404) return MAGISTER_SESSION_EXPIRED_MESSAGE;
	return `HTTP error ${status}`;
}
