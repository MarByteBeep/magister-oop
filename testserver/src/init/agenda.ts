import { faker } from '@faker-js/faker';
import { timeTable } from '@/lib/agendaUtils';
import type { AgendaItem, AttendanceStaffMember, AttendanceStudent } from '@/magister/response/agenda.types';
import type { StaffMember } from '@/magister/response/staffmember.types';
import type { StudentBase } from '@/magister/response/student.types';
import { pickRandom } from '../api/utils/random';

const vakken = [
	{ code: 'BI', omschrijving: 'Biologie' },
	{ code: 'SK', omschrijving: 'Scheikunde' },
	{ code: 'NK', omschrijving: 'Natuurkunde' },
	{ code: 'WI', omschrijving: 'Wiskunde' },
	{ code: 'AK', omschrijving: 'Aardrijkskunde' },
	{ code: 'BV', omschrijving: 'Beeldende Vorming' },
	{ code: 'EN', omschrijving: 'Engels' },
	{ code: 'NE', omschrijving: 'Nederlands' },
	{ code: 'DU', omschrijving: 'Duits' },
	{ code: 'FR', omschrijving: 'Frans' },
];

function toUtcISO(timeString: string) {
	const [h, m] = timeString.split(':').map(Number);

	const d = new Date();
	d.setHours(h, m, 0, 0);

	const iso = d.toISOString();
	const utcTime = iso.split('T')[1];
	return `{date}T${utcTime}`;
}

function generateBaseAgendaItem(classCode: string, teacher: StaffMember, hour: number): AgendaItem {
	const slot = timeTable[hour - 1];
	const vak = pickRandom(vakken);
	const locatie = pickRandom(['d01', 'd02', 'd03', 'd04', 'd05', 'd06', '654', '243']);

	const teacherParticipant: AttendanceStaffMember = {
		code: teacher.code,
		voorletters: teacher.voorletters,
		roepnaam: teacher.roepnaam,
		tussenvoegsel: teacher.tussenvoegsel,
		achternaam: teacher.achternaam,
		id: teacher.id,
		type: 'medewerker',
		links: {
			self: {
				href: `/api/medewerkers/${teacher.id}`,
			},
		},
	};

	return {
		id: faker.number.int({ min: 1000000, max: 9999999 }),
		heeftInhoud: faker.datatype.boolean(),
		heeftAantekening: faker.datatype.boolean(),
		onderwijstijd: 40,
		subtype: 'nvt',
		heeftBijlagen: faker.datatype.boolean(),
		herhaalStatus: 'geen',
		begin: toUtcISO(slot.begin),
		einde: toUtcISO(slot.einde),
		lesuur: {
			begin: hour,
			einde: hour,
		},
		onderwerp: `${vak.code} - ${classCode}`,
		type: 'les',
		opmerking: faker.datatype.boolean(0.2) ? faker.lorem.sentence() : null,
		isPrive: faker.datatype.boolean(0.1),
		deelnames: [
			{
				code: classCode,
				omschrijving: `Klas ${classCode}`,
				id: faker.number.int({ min: 10000, max: 99999 }),
				type: 'groep',
				links: {
					self: {
						href: `/api/groepen/${faker.number.int({ min: 10000, max: 99999 })}`,
					},
				},
			},
			teacherParticipant,
		],
		vakken: [
			{
				id: faker.number.int({ min: 1, max: 20 }),
				code: vak.code,
				omschrijving: vak.omschrijving,
				links: {
					self: {
						href: `/api/vakken/${faker.number.int({ min: 1, max: 20 })}`,
					},
				},
			},
		],
		locaties: [
			{
				omschrijving: locatie,
				type: 'lokaal',
				links: {},
			},
		],
		links: {
			self: {
				href: `/api/afspraken/${faker.number.int({ min: 1000000, max: 9999999 })}`,
			},
		},
	};
}

function createStudentParticipant(student: StudentBase): AttendanceStudent {
	return {
		stamklas: student.klassen[0],
		voorletters: student.voorletters,
		roepnaam: student.roepnaam,
		tussenvoegsel: student.tussenvoegsel,
		achternaam: student.achternaam,
		id: student.id,
		type: 'leerling',
		links: {
			self: {
				href: `/api/leerlingen/${student.id}`,
			},
		},
	};
}

function addStudentToAgenda(student: StudentBase, baseItem: AgendaItem, studentAgenda: AgendaItem[]): void {
	const itemForStudent: AgendaItem = JSON.parse(JSON.stringify(baseItem));
	itemForStudent.deelnames.push(createStudentParticipant(student));
	studentAgenda.push(itemForStudent);
}

function buildClassSchedule(classCode: string, classTeacher: StaffMember): AgendaItem[] {
	const classSchedule: AgendaItem[] = [];
	const numLessonsForClass = faker.number.int({ min: 4, max: 8 });
	const usedHours = new Set<number>();

	for (let i = 0; i < numLessonsForClass; i++) {
		let hour: number;
		do {
			hour = faker.number.int({ min: 1, max: timeTable.length });
		} while (usedHours.has(hour));
		usedHours.add(hour);

		classSchedule.push(generateBaseAgendaItem(classCode, classTeacher, hour));
	}

	return classSchedule;
}

function assignClassAgendas(
	allStudents: StudentBase[],
	focusClasses: string[],
	activeTeachers: StaffMember[],
	allStudentsAgenda: Record<number, AgendaItem[]>,
	studentsWithGeneratedAgenda: Set<number>,
) {
	for (const classCode of focusClasses) {
		faker.seed(classCode.charCodeAt(0));
		const studentsInClass = allStudents.filter((s) => s.klassen.includes(classCode));
		if (studentsInClass.length === 0) continue;

		const classTeacher = activeTeachers.length > 0 ? pickRandom(activeTeachers) : undefined;
		if (!classTeacher) {
			console.warn(`No teacher available for class ${classCode}. Skipping class schedule.`);
			continue;
		}

		const classSchedule = buildClassSchedule(classCode, classTeacher);

		for (const student of studentsInClass) {
			const studentAgenda: AgendaItem[] = [];
			for (const baseItem of classSchedule) {
				addStudentToAgenda(student, baseItem, studentAgenda);
			}
			studentAgenda.sort((a, b) => new Date(a.begin).getTime() - new Date(b.begin).getTime());
			allStudentsAgenda[student.id] = studentAgenda;
			studentsWithGeneratedAgenda.add(student.id);
		}
	}
}

function assignIndividualAgendas(
	allStudents: StudentBase[],
	activeTeachers: StaffMember[],
	allStudentsAgenda: Record<number, AgendaItem[]>,
	studentsWithGeneratedAgenda: Set<number>,
) {
	for (const student of allStudents) {
		if (studentsWithGeneratedAgenda.has(student.id)) continue;

		faker.seed(student.id);
		const numLessons = faker.number.int({ min: 4, max: 10 });
		const studentAgenda: AgendaItem[] = [];
		const usedHours = new Set<number>();

		for (let i = 0; i < numLessons; i++) {
			let hour: number;
			do {
				hour = faker.number.int({ min: 1, max: timeTable.length });
			} while (usedHours.has(hour));
			usedHours.add(hour);

			const teacher = activeTeachers.length > 0 ? pickRandom(activeTeachers) : undefined;
			if (!teacher) continue;

			const baseItem = generateBaseAgendaItem(student.klassen[0], teacher, hour);
			addStudentToAgenda(student, baseItem, studentAgenda);
		}

		studentAgenda.sort((a, b) => new Date(a.begin).getTime() - new Date(b.begin).getTime());
		allStudentsAgenda[student.id] = studentAgenda;
	}
}

export function generateAgendaData(
	allStudents: StudentBase[],
	allStaffMembers: StaffMember[],
): Record<number, AgendaItem[]> {
	const allStudentsAgenda: Record<number, AgendaItem[]> = {};
	const numActiveTeachers = Math.floor(allStaffMembers.length * 0.3);
	const activeTeachers = faker.helpers.shuffle([...allStaffMembers]).slice(0, numActiveTeachers);

	if (activeTeachers.length === 0) {
		console.warn('No active teachers selected. Agenda generation might be limited.');
	}

	const uniqueClasses = Array.from(new Set(allStudents.flatMap((s) => s.klassen)));
	const focusClasses = faker.helpers.shuffle(uniqueClasses).slice(0, Math.min(uniqueClasses.length, 3));
	const studentsWithGeneratedAgenda = new Set<number>();

	assignClassAgendas(allStudents, focusClasses, activeTeachers, allStudentsAgenda, studentsWithGeneratedAgenda);
	assignIndividualAgendas(allStudents, activeTeachers, allStudentsAgenda, studentsWithGeneratedAgenda);

	return allStudentsAgenda;
}
