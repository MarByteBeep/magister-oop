import { removeRegistration } from '../../m6/verantwoordingen/ongeoorloofderegistraties';

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

/** DELETE `/api/medewerkers/afspraken/verantwoordingen/:id` */
export async function DELETE(_req: Request, registrationId: number): Promise<Response> {
	if (!removeRegistration(registrationId)) {
		return new Response(JSON.stringify({ error: 'Registration not found' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	console.log(`Deleted registration ${registrationId}`);
	return new Response(null, { status: 204 });
}
