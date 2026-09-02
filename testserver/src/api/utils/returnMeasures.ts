import { getDateKey, parseDateKey, toISOFromDateKeyAndTime } from '@/lib/dateUtils';
import type { Measure, ReturnMeasure } from '@/magister/response/return-measure.types';

export type StoredReturnMeasureTemplate = {
	id: number;
	dayOffset: number;
	omschrijving: string | null;
	maatregel: Measure | null;
	beginTime: string;
	endTime: string;
};

export function expandReturnMeasureTemplates(
	templates: StoredReturnMeasureTemplate[],
	beginDateKey: string,
	endDateKey: string,
): ReturnMeasure[] {
	const beginDate = parseDateKey(beginDateKey);
	const endDate = parseDateKey(endDateKey);

	return templates.flatMap((template) => {
		const date = new Date(beginDate);
		date.setDate(date.getDate() + template.dayOffset);
		const dateKey = getDateKey(date);

		if (date < beginDate || date > endDate) return [];

		const measure: ReturnMeasure = {
			id: template.id,
			begin: toISOFromDateKeyAndTime(dateKey, template.beginTime),
			einde: toISOFromDateKeyAndTime(dateKey, template.endTime),
			maatregel: template.maatregel,
			omschrijving: template.omschrijving,
			links: undefined,
		};

		return [measure];
	});
}
