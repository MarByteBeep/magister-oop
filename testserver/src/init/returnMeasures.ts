import { faker } from '@faker-js/faker';
import type { Measure } from '@/magister/response/returnMeasure.types';
import type { StaffMember } from '@/magister/response/staffMember.types';
import type { StudentBase } from '@/magister/response/student.types';
import type { StoredReturnMeasureTemplate } from '../api/utils/returnMeasures';

/**
 * Fixture shapes for the three schedule kinds the planner must exercise:
 * - full-day (vierkant rooster) 08:00–16:00
 * - pre-school (8 uur melden) 08:00–08:30
 * - hour / multi-hour during the school day
 *
 * Dutch copy stays in API payloads on purpose.
 */
const TEST_RETURN_MEASURES = [
	{
		description: 'Niet (tijdig) gemeld bij terugkomen op 24 juni',
		measureLabel: '6e x te laat VP; 2 dagen vierkant rooster',
		dayOffset: 0,
		dayCount: 1,
		startTime: '08:00',
		endTime: '16:00',
		hasReported: false,
		hasNotReported: false,
		handledTime: null,
	},
	{
		description: 'Te laat zonder geldige reden',
		measureLabel: '8 uur melden',
		dayOffset: 0,
		dayCount: 1,
		startTime: '08:00',
		endTime: '08:30',
		hasReported: false,
		hasNotReported: false,
		handledTime: null,
	},
	{
		description: 'Spijbelen 3e uur zonder bericht',
		measureLabel: 'Uur nakomen',
		dayOffset: 0,
		dayCount: 1,
		startTime: '10:50',
		endTime: '11:30',
		hasReported: false,
		hasNotReported: false,
		handledTime: null,
	},
	{
		description: 'Verwijderd uit de les; 2 uur nakomen',
		measureLabel: 'Van het plein (2 uur)',
		dayOffset: 0,
		dayCount: 1,
		startTime: '13:20',
		endTime: '14:40',
		hasReported: false,
		hasNotReported: false,
		handledTime: null,
	},
	{
		description: 'Niet (tijdig) gemeld bij terugkomen op 30 juni',
		measureLabel: 'Uur nakomen',
		dayOffset: 0,
		dayCount: 1,
		startTime: '08:30',
		endTime: '09:10',
		hasReported: true,
		hasNotReported: false,
		handledTime: '09:10',
	},
	{
		description: 'Spijbelen zonder bericht op 15 juni',
		measureLabel: 'Van het plein (1 uur)',
		dayOffset: -3,
		dayCount: 1,
		startTime: '10:50',
		endTime: '11:30',
		hasReported: false,
		hasNotReported: true,
		handledTime: '11:30',
	},
	{
		description: 'Herhaald te laat; volgende week vierkant',
		measureLabel: '6e x te laat VP; 2 dagen vierkant rooster',
		dayOffset: 4,
		dayCount: 2,
		startTime: '08:00',
		endTime: '16:00',
		hasReported: false,
		hasNotReported: false,
		handledTime: null,
	},
	{
		description: '8 uur melden morgen',
		measureLabel: '8 uur melden',
		dayOffset: 1,
		dayCount: 1,
		startTime: '08:00',
		endTime: '08:30',
		hasReported: false,
		hasNotReported: false,
		handledTime: null,
	},
	{
		description: 'Herhaald te laat; nog in te plannen',
		measureLabel: null,
		dayOffset: null,
		dayCount: 1,
		startTime: '08:30',
		endTime: '09:10',
		hasReported: false,
		hasNotReported: true,
		handledTime: null,
	},
] as const;

const MEASURE_IDS: Record<string, number> = {
	'6e x te laat VP; 2 dagen vierkant rooster': 8482,
	'8 uur melden': 8488,
	'Uur nakomen': 8512,
	'Van het plein (1 uur)': 8513,
	'Van het plein (2 uur)': 8514,
};

function createTemplate(measureIndex: number, studentId: number, staffId: number): StoredReturnMeasureTemplate {
	const template = TEST_RETURN_MEASURES[measureIndex % TEST_RETURN_MEASURES.length];
	faker.seed(studentId + measureIndex * 17);

	const measure = template.measureLabel
		? ({
				id: MEASURE_IDS[template.measureLabel] ?? faker.number.int({ min: 8000, max: 8999 }),
				omschrijving: template.measureLabel,
			} satisfies Measure)
		: null;

	const reported = template.hasReported || template.hasNotReported;

	return {
		id: faker.number.int({ min: 100_000, max: 999_999 }),
		dayOffset: template.dayOffset,
		dayCount: template.dayCount,
		description: template.description,
		measure,
		startTime: template.startTime,
		endTime: template.endTime,
		hasReported: template.hasReported,
		hasNotReported: template.hasNotReported,
		handledTime: template.handledTime,
		handledById: reported ? staffId : null,
	};
}

export function generateReturnMeasureData(
	allStudents: StudentBase[],
	allStaff: StaffMember[],
): Record<number, StoredReturnMeasureTemplate[]> {
	const result: Record<number, StoredReturnMeasureTemplate[]> = {};
	let measureCounter = 0;

	for (const student of allStudents) {
		// Most students get one measure; every 4th eligible student gets two kinds.
		if (student.id % 2 !== 0) continue;

		const staffId = allStaff[measureCounter % allStaff.length]?.id ?? 0;
		const primary = createTemplate(measureCounter, student.id, staffId);
		const templates: StoredReturnMeasureTemplate[] = [primary];

		if (student.id % 8 === 0) {
			templates.push(createTemplate(measureCounter + 1, student.id, staffId));
		}

		result[student.id] = templates;
		measureCounter += templates.length;
	}

	return result;
}
