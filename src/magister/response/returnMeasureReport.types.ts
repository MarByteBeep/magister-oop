/**
 * Request body for PUT `/api/terugkommaatregelen/{id}/melding`.
 * Field names and values match the Magister API (Dutch).
 */
export type ReturnMeasureReportRequest = {
	type: 'Tijdig' | 'NietTijdig';
};
