const startDate = '2025-08-01';

export const endpoints = {
	account: () => '/api/account',
	searchStudents: (top: number, skip: number) =>
		`/api/leerlingen/zoeken?q=**&top=${top}&skip=${skip}&orderby=achternaam%20asc&peildatum=${startDate}&velden=stamnummer&velden=naam&velden=klassen&velden=studies&velden=emailadres&velden=telefoonnummer&velden=KlassenMentor1`,
	searchStaff: (top: number, skip: number) => `/api/medewerkers/zoeken?top=${top}&skip=${skip}&q=**&status=actief`,
	lockers: () =>
		import.meta.env.PROD ? 'https://lockers.magister.net/api/v1/lockers/details' : '/api/v1/lockers/details',

	unauthorizedAbsences: (date: string) => `/api/m6/verantwoordingen/ongeoorloofderegistraties?datum=${date}`,

	agenda: (studentId: number, start: string, end: string) =>
		`/api/leerlingen/${studentId}/afspraken?begin=${start}&einde=${end}&status=actief`,
	studentPhoto: (id: number) => `/api/leerlingen/${id}/foto`,
	studentPersonalDetails: (id: number) => `/api/leerlingen/${id}/personalia`,
	studentAddress: (id: number) => `/api/leerlingen/${id}/adresgegevens`,
	studentParents: (id: number) => `/api/leerlingen/${id}/ouders`,

	parentContactDetails: (id: number) => `/api/ouders/${id}/contactgegevens`,
	parentChildren: (id: number) => `/api/ouders/${id}/kinderen`,
	parentAddress: (id: number) => `/api/ouders/${id}/adresgegevens`,
	unreadLog: (top: number, skip: number) => `/api/lvs/logboekformulieren/ongelezen?top=${top}&skip=${skip}`,
	createAccountability: (appointmentId: number) => `/api/medewerkers/afspraken/${appointmentId}/verantwoordingen`,
};
