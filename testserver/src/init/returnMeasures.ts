import { faker } from '@faker-js/faker';
import type { Measure } from '@/magister/response/returnMeasure.types';
import type { StaffMember } from '@/magister/response/staffMember.types';
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
		handledTime: '11:50',
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

function measureFromLabel(measureLabel: string | null): Measure | null {
	if (!measureLabel) return null;
	return {
		id: MEASURE_IDS[measureLabel] ?? faker.number.int({ min: 8000, max: 8999 }),
		omschrijving: measureLabel,
	};
}

function handledByIdForTemplate(hasReported: boolean, hasNotReported: boolean, staffId: number): number | null {
	if (hasReported || hasNotReported) return staffId;
	return null;
}

function createTemplate(measureIndex: number, studentId: number, staffId: number): StoredReturnMeasureTemplate {
	const template = TEST_RETURN_MEASURES[measureIndex % TEST_RETURN_MEASURES.length];
	faker.seed(studentId + measureIndex);

	return {
		id: faker.number.int({ min: 100_000, max: 999_999 }),
		dayOffset: template.dayOffset,
		description: template.description,
		measure: measureFromLabel(template.measureLabel),
		startTime: template.startTime,
		endTime: template.endTime,
		hasReported: template.hasReported,
		hasNotReported: template.hasNotReported,
		handledTime: template.handledTime,
		handledById: handledByIdForTemplate(template.hasReported, template.hasNotReported, staffId),
	};
}

function shouldGenerateReturnMeasure(studentId: number): boolean {
	return studentId % 3 === 0;
}

function staffIdForCounter(allStaff: StaffMember[], measureCounter: number): number {
	return allStaff[measureCounter % allStaff.length]?.id ?? 0;
}

export function generateReturnMeasureData(
	allStudents: StudentBase[],
	allStaff: StaffMember[],
): Record<number, StoredReturnMeasureTemplate[]> {
	const result: Record<number, StoredReturnMeasureTemplate[]> = {};
	let measureCounter = 0;

	for (const student of allStudents) {
		if (!shouldGenerateReturnMeasure(student.id)) continue;
		result[student.id] = [createTemplate(measureCounter, student.id, staffIdForCounter(allStaff, measureCounter))];
		measureCounter++;
	}

	return result;
}
