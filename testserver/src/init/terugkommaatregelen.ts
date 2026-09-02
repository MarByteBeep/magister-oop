import { faker } from '@faker-js/faker';
import type { Measure } from '@/magister/response/return-measure.types';
import type { StudentBase } from '@/magister/response/student.types';
import type { StoredReturnMeasureTemplate } from '../api/utils/returnMeasures';

const TEST_RETURN_MEASURES = [
	{
		omschrijving: 'Niet (tijdig) gemeld bij terugkomen op 24 juni',
		maatregelOmschrijving: '6e x te laat VP; 2 dagen vierkant rooster',
		beginTime: '08:00',
		endTime: '16:00',
	},
	{
		omschrijving: 'Niet (tijdig) gemeld bij terugkomen op 30 juni',
		maatregelOmschrijving: 'Uur nakomen',
		beginTime: '08:30',
		endTime: '09:30',
	},
	{
		omschrijving: null,
		maatregelOmschrijving: 'Van het plein (1 uur)',
		beginTime: '10:50',
		endTime: '11:50',
	},
	{
		omschrijving: 'Spijbelen zonder bericht op 15 juni',
		maatregelOmschrijving: null,
		beginTime: '13:20',
		endTime: '15:20',
	},
] as const;

const MEASURE_IDS: Record<string, number> = {
	'6e x te laat VP; 2 dagen vierkant rooster': 8482,
	'Uur nakomen': 8512,
	'Van het plein (1 uur)': 8513,
};

function createTemplate(dayOffset: number, measureIndex: number, studentId: number): StoredReturnMeasureTemplate {
	const measure = TEST_RETURN_MEASURES[measureIndex % TEST_RETURN_MEASURES.length];
	faker.seed(studentId + dayOffset * 1000 + measureIndex);

	const maatregel = measure.maatregelOmschrijving
		? ({
				id: MEASURE_IDS[measure.maatregelOmschrijving] ?? faker.number.int({ min: 8000, max: 8999 }),
				omschrijving: measure.maatregelOmschrijving,
				links: {},
			} satisfies Measure)
		: null;

	return {
		id: faker.number.int({ min: 100_000, max: 999_999 }),
		dayOffset,
		omschrijving: measure.omschrijving,
		maatregel,
		beginTime: measure.beginTime,
		endTime: measure.endTime,
	};
}

export function generateReturnMeasureData(allStudents: StudentBase[]): Record<number, StoredReturnMeasureTemplate[]> {
	const result: Record<number, StoredReturnMeasureTemplate[]> = {};
	let measureCounter = 0;

	for (const student of allStudents) {
		if (student.id % 3 !== 0) continue;

		const measureIndex = measureCounter % TEST_RETURN_MEASURES.length;
		result[student.id] = [createTemplate(0, measureIndex, student.id)];
		measureCounter++;
	}

	return result;
}
