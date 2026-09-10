import { faker } from '@faker-js/faker';
import type { Measure } from '@/magister/response/return-measure.types';
import type { StaffMember } from '@/magister/response/staffmember.types';
import type { StudentBase } from '@/magister/response/student.types';
import type { StoredReturnMeasureTemplate } from '../api/utils/returnMeasures';

// The texts are Dutch on purpose: they end up in API payloads the app renders as-is.
const TEST_RETURN_MEASURES = [
	{
		description: 'Niet (tijdig) gemeld bij terugkomen op 24 juni',
		measureLabel: '6e x te laat VP; 2 dagen vierkant rooster',
		dayOffset: 0,
		startTime: '08:00',
		endTime: '16:00',
		hasReported: false,
		hasNotReported: false,
		handledTime: null,
	},
	{
		description: 'Niet (tijdig) gemeld bij terugkomen op 30 juni',
		measureLabel: 'Uur nakomen',
		dayOffset: 0,
		startTime: '08:30',
		endTime: '09:30',
		hasReported: true,
		hasNotReported: false,
		handledTime: '09:30',
	},
	{
		description: 'Spijbelen zonder bericht op 15 juni',
		measureLabel: 'Van het plein (1 uur)',
		dayOffset: -3,
		startTime: '10:50',
		endTime: '11:50',
		hasReported: false,
		hasNotReported: true,
		handledTime: null,
	},
	{
		description: 'Te laat zonder geldige reden',
		measureLabel: null,
		dayOffset: 4,
		startTime: '13:20',
		endTime: '15:20',
		hasReported: false,
		hasNotReported: false,
		handledTime: null,
	},
	{
		description: 'Herhaald te laat; nog in te plannen',
		measureLabel: null,
		dayOffset: null,
		startTime: '08:30',
		endTime: '09:30',
		hasReported: false,
		hasNotReported: true,
		handledTime: null,
	},
] as const;

const MEASURE_IDS: Record<string, number> = {
	'6e x te laat VP; 2 dagen vierkant rooster': 8482,
	'Uur nakomen': 8512,
	'Van het plein (1 uur)': 8513,
};

function createTemplate(measureIndex: number, studentId: number, staffId: number): StoredReturnMeasureTemplate {
	const template = TEST_RETURN_MEASURES[measureIndex % TEST_RETURN_MEASURES.length];
	faker.seed(studentId + measureIndex);

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
		if (student.id % 3 !== 0) continue;

		const staffId = allStaff[measureCounter % allStaff.length]?.id ?? 0;
		result[student.id] = [createTemplate(measureCounter, student.id, staffId)];
		measureCounter++;
	}

	return result;
}
