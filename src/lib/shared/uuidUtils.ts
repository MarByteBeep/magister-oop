/**
 * Magister's platform APIs address students by their externeId in compact form:
 * 32 lowercase hex characters without dashes.
 */
export function compactUuid(uuid: string): string {
	return uuid.replace(/-/g, '').toLowerCase();
}
