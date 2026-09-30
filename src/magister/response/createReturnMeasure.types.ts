/**
 * Request body for POST `/api/leerlingen/{id}/verantwoordingen/terugkommaatregelen`.
 * Field names match the Magister API (Dutch).
 */
export type CreateReturnMeasureRequest = {
	omschrijving: string;
	/** Local return date as ISO UTC (midnight in the school's timezone). */
	terugkomenOp: string;
	beginTijd: string;
	eindTijd: string;
	aantalDagen: string;
};
