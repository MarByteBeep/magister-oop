import type { AttendanceType, AttendanceTypesResponse } from '@/magister/response/attendanceType.types';

const ATTENDANCE_TYPES: AttendanceType[] = [
	{ code: 'A', description: 'Afwezig', commentMandatory: false, attachmentAllowed: false },
	{ code: 'D', description: 'Dokter, Huisarts', commentMandatory: false, attachmentAllowed: false },
	{ code: 'F', description: 'Familie omstandigheden', commentMandatory: false, attachmentAllowed: false },
	{ code: 'O', description: 'Orthodontist', commentMandatory: false, attachmentAllowed: false },
	{ code: 'R', description: 'Roken / van het plein af', commentMandatory: false, attachmentAllowed: false },
	{ code: 'T', description: 'Tandarts bezoek', commentMandatory: false, attachmentAllowed: false },
	{ code: 'ZK', description: 'Ziek gemeld', commentMandatory: false, attachmentAllowed: false },
	{ code: 'S', description: 'Spijbelgedrag', commentMandatory: false, attachmentAllowed: false },
	{ code: 'GL', description: 'Geschorst van lessen', commentMandatory: false, attachmentAllowed: false },
	{ code: 'K', description: 'Directie (vakantie)', commentMandatory: false, attachmentAllowed: false },
	{ code: 'N', description: 'NIET ziek gemeld', commentMandatory: false, attachmentAllowed: false },
	{ code: 'SL', description: 'Schoolleiding', commentMandatory: false, attachmentAllowed: false },
	{ code: 'M', description: 'Melden als Strafmaatregel', commentMandatory: false, attachmentAllowed: false },
	{ code: 'MV', description: 'Melding verwerkt', commentMandatory: false, attachmentAllowed: false },
	{ code: 'E', description: 'Examens, rijbewijs etc.', commentMandatory: false, attachmentAllowed: false },
	{ code: 'GK', description: 'Gele kaart', commentMandatory: false, attachmentAllowed: false },
	{ code: 'ZH', description: 'Ziek naar huis', commentMandatory: false, attachmentAllowed: false },
	{ code: 'SA', description: 'Spijbelen afgehandeld', commentMandatory: false, attachmentAllowed: false },
	{ code: 'GV', description: 'Geschorst verwerkt', commentMandatory: false, attachmentAllowed: false },
	{ code: 'GS', description: 'Geschorst van school', commentMandatory: false, attachmentAllowed: false },
	{ code: 'LA', description: 'Leerplicht Ambtenaar', commentMandatory: false, attachmentAllowed: false },
	{ code: 'VR', description: 'Vrijstelling ', commentMandatory: false, attachmentAllowed: false },
	{ code: 'W', description: 'Weg van het plein', commentMandatory: false, attachmentAllowed: false },
	{ code: 'P', description: 'Pluspunt', commentMandatory: false, attachmentAllowed: false },
	{ code: 'RB', description: 'Reden bekend', commentMandatory: false, attachmentAllowed: false },
	{ code: 'LL', description: 'Leerlingenloket', commentMandatory: false, attachmentAllowed: false },
	{ code: 'IM', description: 'Interne Maatregel', commentMandatory: false, attachmentAllowed: false },
	{ code: 'WP', description: 'Werkplein/365', commentMandatory: false, attachmentAllowed: false },
	{ code: 'PS', description: 'Aangesproken pauzesurveillant', commentMandatory: false, attachmentAllowed: false },
	{ code: 'RT', description: 'RT', commentMandatory: false, attachmentAllowed: false },
	{ code: 'AR', description: 'Aangepast rooster', commentMandatory: false, attachmentAllowed: false },
];

export async function GET(_req: Request, _studentUuid: string): Promise<Response> {
	const response: AttendanceTypesResponse = ATTENDANCE_TYPES;
	return new Response(JSON.stringify(response), {
		headers: { 'Content-Type': 'application/json' },
	});
}
