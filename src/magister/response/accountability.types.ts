/**
 * Request payload for creating an accountability report (verantwoording)
 */
export type CreateAccountabilityRequest = {
	/** Person ID (student ID) */
	persoonId: number;
	/** Reason ID (hardcoded to 4 for tardy) */
	redenId: number;
	/** Optional comment/remark */
	opmerking: string;
};
