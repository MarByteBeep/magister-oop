const startDate = '2025-08-01';
const port = Number(import.meta.env.VITE_TESTSERVER_PORT);
if (!port) throw new Error('Missing or invalid port in .env file');
const server = import.meta.env.DEV ? `http://localhost:${port}` : '';

export const endpoints = {
	account: () => `${server}/api/account`,
	searchStudents: (top: number, skip: number) =>
		`${server}/api/leerlingen/zoeken?q=**&top=${top}&skip=${skip}&orderby=achternaam%20asc&peildatum=${startDate}&velden=stamnummer&velden=naam&velden=klassen&velden=studies&velden=emailadres&velden=telefoonnummer&velden=KlassenMentor1`,
	searchStaff: (top: number, skip: number) =>
		`${server}/api/medewerkers/zoeken?top=${top}&skip=${skip}&q=**&status=actief`,
	lockers: () =>
		import.meta.env.PROD
			? 'https://lockers.magister.net/api/v1/lockers/details'
			: `${server}/api/v1/lockers/details`,

	unauthorizedAbsences: (date: string) => `${server}/api/m6/verantwoordingen/ongeoorloofderegistraties?datum=${date}`,

	agenda: (studentId: number, start: string, end: string) =>
		`${server}/api/leerlingen/${studentId}/afspraken?begin=${start}&einde=${end}&status=actief`,
	studentPhoto: (id: number) => `${server}/api/leerlingen/${id}/foto`,
	studentPersonalDetails: (id: number) => `${server}/api/leerlingen/${id}/personalia`,
	studentAddress: (id: number) => `${server}/api/leerlingen/${id}/adresgegevens`,
	studentParents: (id: number) => `${server}/api/leerlingen/${id}/ouders`,

	parentContactDetails: (id: number) => `${server}/api/ouders/${id}/contactgegevens`,
	parentChildren: (id: number) => `${server}/api/ouders/${id}/kinderen`,
	parentAddress: (id: number) => `${server}/api/ouders/${id}/adresgegevens`,
	unreadLog: (top: number, skip: number) => `/api/lvs/logboekformulieren/ongelezen?top=${top}&skip=${skip}`,
	createAccountability: (appointmentId: number) =>
		`${server}/api/medewerkers/afspraken/${appointmentId}/verantwoordingen`,
};
