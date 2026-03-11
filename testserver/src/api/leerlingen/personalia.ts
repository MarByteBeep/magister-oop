import type { StudentDetails } from '@/magister/response/student-details.types';

export async function GET(_req: Request, id: number): Promise<Response> {
	Bun.sleepSync(100);
	const details: StudentDetails = {
		id: id, // Dynamically set the ID
		woonsituatie: {
			id: 1,
			omschrijving: 'thuis bij ouders',
		},
		voorletters: 'L.',
		roepnaam: 'Loedy',
		tussenvoegsel: null,
		achternaam: 'Vrolijk',
		officieleVoornamen: 'Loedy',
		officieleTussenvoegsels: null,
		officieleAchternaam: 'Vrolijk',
		geboortedatum: '2002-05-17',
		geboorteplaats: 'Amsterdam',
		geboortegemeente: {
			id: 166,
			omschrijving: 'Amsterdam',
		},
		geboorteland: {
			id: 183,
			omschrijving: 'Nederland',
		},
		geslacht: 'man',
		nationaliteit: {
			id: 183,
			omschrijving: 'NEDERLANDSE',
		},
		emailadres: 'loedy.vrolijk@example.com', // Added a dummy email
		telefoonnummer: '06-12345678', // Added a dummy phone number
		klassen: ['4T1'], // Added dummy classes
		studies: ['4T'], // Added dummy studies
		links: {
			self: {
				href: `/api/leerlingen/${id}/personalia`, // Dynamically set the self link
			},
		},
	};

	return new Response(JSON.stringify(details), {
		headers: { 'Content-Type': 'application/json' },
	});
}
