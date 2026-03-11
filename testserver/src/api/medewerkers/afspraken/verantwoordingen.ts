/**
 * POST handler for creating accountability reports (verantwoordingen)
 * Returns 204 No Content on success (matching Magister API behavior)
 */
export async function POST(_req: Request, appointmentId: number): Promise<Response> {
	// Log the request for debugging
	console.log(`Creating accountability report for appointment ${appointmentId}`);

	// Return 204 No Content (no response body) as per Magister API
	return new Response(null, {
		status: 204,
	});
}
