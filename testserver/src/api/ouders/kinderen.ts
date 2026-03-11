import type { ChildrenResponse } from '@/magister/response/child.types';

export async function GET(_req: Request, _id: number): Promise<Response> {
	const response: ChildrenResponse = {
		items: [
			{
				id: 40660,
				roepnaam: 'Anouk',
				voorletters: 'B.',
				tussenvoegsel: null,
				achternaam: 'de Haan',
				aanmeldingStatus: 'actief',
				actieveAanmeldingen: [
					{
						stamklas: {
							code: '1T2',
							links: {
								self: {
									href: '/api/groepen/17244',
								},
							},
						},
						links: {
							self: {
								href: '/api/aanmeldingen/85640',
							},
						},
					},
				],
				links: {
					self: {
						href: '/api/leerlingen/40660',
					},
					foto: {
						href: '/api/leerlingen/40660/foto',
					},
				},
			},
			{
				id: 43315,
				roepnaam: 'Delano',
				voorletters: 'D.',
				tussenvoegsel: null,
				achternaam: 'de Haan',
				aanmeldingStatus: 'actief',
				actieveAanmeldingen: [
					{
						stamklas: {
							code: '2B1',
							links: {
								self: {
									href: '/api/groepen/17230',
								},
							},
						},
						links: {
							self: {
								href: '/api/aanmeldingen/85490',
							},
						},
					},
				],
				links: {
					self: {
						href: '/api/leerlingen/43315',
					},
					foto: {
						href: '/api/leerlingen/43315/foto',
					},
				},
			},
		],
		links: {},
		totalCount: 2,
	};

	return new Response(JSON.stringify(response), {
		headers: { 'Content-Type': 'application/json' },
	});
}
