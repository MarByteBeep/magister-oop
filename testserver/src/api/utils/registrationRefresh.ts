import { timeTable } from '@/lib/agenda/utils';
import { registrationDeleteId } from '@/lib/registrations/entries';
import type { RegistrationsResponse } from '@/magister/response/registrations.types';
import type { StudentBase } from '@/magister/response/student.types';
import { pickRandom } from './random';

export type RegistrationItem = RegistrationsResponse['items'][number];
export type Appointment = RegistrationItem['afspraken'][number];

/** Local lesson-clock time on `date`, same conversion as generated agenda lessons. */
export function lessonTimeToIso(time: string, date: string): string {
	const [hours, minutes] = time.split(':').map(Number);
	const local = new Date(`${date}T00:00:00`);
	local.setHours(hours, minutes, 0, 0);
	return local.toISOString();
}

function isValidLessonHour(hour: number): boolean {
	return hour >= 1 && hour <= timeTable.length;
}

export function applyLessonTimes(appointment: Appointment, todayKey: string): void {
	if (!isValidLessonHour(appointment.lesuurBegin)) return;
	if (!isValidLessonHour(appointment.lesuurEinde)) return;

	const startSlot = timeTable[appointment.lesuurBegin - 1];
	const endSlot = timeTable[appointment.lesuurEinde - 1];
	appointment.begin = lessonTimeToIso(startSlot.start, todayKey);
	appointment.einde = lessonTimeToIso(endSlot.end, todayKey);
}

function applyStudentFields(item: RegistrationItem, student: StudentBase): void {
	item.id = student.id;
	item.achternaam = student.achternaam;
	item.roepnaam = student.roepnaam;
	item.voorletters = student.voorletters;
}

export function refreshRegistrationItem(item: RegistrationItem, students: StudentBase[], todayKey: string): void {
	applyStudentFields(item, pickRandom(students));
	for (const appointment of item.afspraken) {
		applyLessonTimes(appointment, todayKey);
	}
}

function filterJustification(appointment: Appointment, registrationId: number): boolean {
	const before = appointment.verantwoordingen.length;
	appointment.verantwoordingen = appointment.verantwoordingen.filter(
		(justification) => registrationDeleteId(justification) !== registrationId,
	);
	return appointment.verantwoordingen.length !== before;
}

export function removeRegistrationFromItem(item: RegistrationItem, registrationId: number): boolean {
	let removed = false;
	for (const appointment of item.afspraken) {
		if (filterJustification(appointment, registrationId)) removed = true;
	}
	return removed;
}

export function buildRegistrationsResponse(data: RegistrationsResponse, todayKey: string): RegistrationsResponse {
	const href = `/api/m6/verantwoordingen/ongeoorloofderegistraties?datum=${todayKey}`;
	return {
		...data,
		links: {
			first: { href },
			last: { href },
		},
	};
}
