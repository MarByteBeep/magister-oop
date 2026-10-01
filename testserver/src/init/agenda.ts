import { faker } from '@faker-js/faker';
import { timeTable } from '@/lib/agenda/utils';
import type {
	AgendaItem,
	AttendanceStaffMember,
	AttendanceStudent,
	Participant,
} from '@/magister/response/agenda.types';
import type { StaffMember } from '@/magister/response/staffMember.types';
import type { StudentBase } from '@/magister/response/student.types';

const WEEKDAY_COUNT = 5;
const MIN_LESSONS_PER_DAY = 8;

const courses = [
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

function generateBaseAgendaItem(classCode: string, teacher: StaffMember, hour: number): AgendaItem<Participant> {
	const slot = timeTable[hour - 1];
	const course = faker.helpers.arrayElement(courses);
	const location = faker.helpers.arrayElement(['d01', 'd02', 'd03', 'd04', 'd05', 'd06', '654', '243']);

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
		begin: toUtcISO(slot.start),
		einde: toUtcISO(slot.end),
		lesuur: {
			begin: hour,
			einde: hour,
		},
		onderwerp: `${course.code} - ${classCode}`,
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
				code: course.code,
				omschrijving: course.omschrijving,
				links: {
					self: {
						href: `/api/vakken/${faker.number.int({ min: 1, max: 20 })}`,
					},
				},
			},
		],
		locaties: [
			{
				omschrijving: location,
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

function addStudentToAgenda(
	student: StudentBase,
	baseItem: AgendaItem<Participant>,
	studentAgenda: AgendaItem<Participant>[],
): void {
	const itemForStudent: AgendaItem<Participant> = JSON.parse(JSON.stringify(baseItem));
	itemForStudent.deelnames.push(createStudentParticipant(student));
	studentAgenda.push(itemForStudent);
}

function seedFromKey(key: string): number {
	let hash = 0;
	for (const char of key) {
		hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
	}
	return hash;
}

function buildDaySchedule(classCode: string, teachers: StaffMember[]): AgendaItem<Participant>[] {
	const lessonCount = faker.number.int({ min: MIN_LESSONS_PER_DAY, max: timeTable.length });
	const hours = faker.helpers
		.shuffle(timeTable.map((_, index) => index + 1))
		.slice(0, lessonCount)
		.sort((a, b) => a - b);

	return hours.map((hour) => generateBaseAgendaItem(classCode, faker.helpers.arrayElement(teachers), hour));
}

function buildWeekSchedule(classCode: string, teachers: StaffMember[]): AgendaItem<Participant>[][] {
	if (teachers.length === 0) return Array.from({ length: WEEKDAY_COUNT }, () => []);
	return Array.from({ length: WEEKDAY_COUNT }, () => buildDaySchedule(classCode, teachers));
}

function dayForStudent(student: StudentBase, day: AgendaItem<Participant>[]): AgendaItem<Participant>[] {
	const studentAgenda: AgendaItem<Participant>[] = [];
	for (const baseItem of day) {
		addStudentToAgenda(student, baseItem, studentAgenda);
	}
	return studentAgenda;
}

function storeWeekForStudents(
	students: StudentBase[],
	week: AgendaItem<Participant>[][],
	allStudentsAgenda: Record<number, AgendaItem<Participant>[][]>,
	studentsWithGeneratedAgenda: Set<number>,
	focusClassStudentIds: Set<number> | null,
): void {
	for (const student of students) {
		allStudentsAgenda[student.id] = week.map((day) => dayForStudent(student, day));
		studentsWithGeneratedAgenda.add(student.id);
		focusClassStudentIds?.add(student.id);
	}
}

function assignClassAgendas(
	allStudents: StudentBase[],
	focusClasses: string[],
	activeTeachers: StaffMember[],
	allStudentsAgenda: Record<number, AgendaItem<Participant>[][]>,
	studentsWithGeneratedAgenda: Set<number>,
	focusClassStudentIds: Set<number>,
) {
	for (const classCode of focusClasses) {
		const studentsInClass = allStudents.filter((s) => s.klassen.includes(classCode));
		if (studentsInClass.length === 0) continue;

		if (activeTeachers.length === 0) {
			console.warn(`No teacher available for class ${classCode}. Skipping class schedule.`);
			continue;
		}

		faker.seed(seedFromKey(classCode));
		const week = buildWeekSchedule(classCode, activeTeachers);
		storeWeekForStudents(
			studentsInClass,
			week,
			allStudentsAgenda,
			studentsWithGeneratedAgenda,
			focusClassStudentIds,
		);
	}
}

function assignIndividualAgendas(
	allStudents: StudentBase[],
	activeTeachers: StaffMember[],
	allStudentsAgenda: Record<number, AgendaItem<Participant>[][]>,
	studentsWithGeneratedAgenda: Set<number>,
) {
	for (const student of allStudents) {
		if (studentsWithGeneratedAgenda.has(student.id)) continue;

		faker.seed(student.id);
		const week = buildWeekSchedule(student.klassen[0], activeTeachers);
		storeWeekForStudents([student], week, allStudentsAgenda, studentsWithGeneratedAgenda, null);
	}
}

export function generateAgendaData(
	allStudents: StudentBase[],
	allStaffMembers: StaffMember[],
): { agenda: Record<number, AgendaItem<Participant>[][]>; focusClassStudentIds: Set<number> } {
	const allStudentsAgenda: Record<number, AgendaItem<Participant>[][]> = {};
	const focusClassStudentIds = new Set<number>();
	const numActiveTeachers = Math.floor(allStaffMembers.length * 0.3);
	const activeTeachers = faker.helpers.shuffle([...allStaffMembers]).slice(0, numActiveTeachers);

	if (activeTeachers.length === 0) {
		console.warn('No active teachers selected. Agenda generation might be limited.');
	}

	const uniqueClasses = Array.from(new Set(allStudents.flatMap((s) => s.klassen)));
	const focusClasses = faker.helpers.shuffle(uniqueClasses).slice(0, Math.min(uniqueClasses.length, 3));
	const studentsWithGeneratedAgenda = new Set<number>();

	assignClassAgendas(
		allStudents,
		focusClasses,
		activeTeachers,
		allStudentsAgenda,
		studentsWithGeneratedAgenda,
		focusClassStudentIds,
	);
	assignIndividualAgendas(allStudents, activeTeachers, allStudentsAgenda, studentsWithGeneratedAgenda);

	return { agenda: allStudentsAgenda, focusClassStudentIds };
}
