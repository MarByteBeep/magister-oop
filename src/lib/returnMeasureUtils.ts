import type { AgendaItem } from '@/magister/response/agenda.types';
import type { ReturnMeasure } from '@/magister/response/return-measure.types';

export const RETURN_MEASURE_AGENDA_TYPE = 'terugkommaatregel';

export type ReturnMeasureDisplay = {
	maatregelOmschrijving: string | null;
	omschrijving: string | null;
	hasMaatregel: boolean;
	hasOmschrijving: boolean;
	hasBoth: boolean;
	primaryLabel: string;
};

export function isReturnMeasureAgendaItem(item: AgendaItem): boolean {
	return item.type === RETURN_MEASURE_AGENDA_TYPE;
}

function normalizeLabel(value: string | null | undefined): string | null {
	if (value == null) return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

export function getReturnMeasureDisplay(item: AgendaItem): ReturnMeasureDisplay {
	const maatregelOmschrijving = normalizeLabel(item.returnMeasureMaatregelOmschrijving);
	const omschrijving = normalizeLabel(item.returnMeasureOmschrijving);
	const hasMaatregel = maatregelOmschrijving != null;
	const hasOmschrijving = omschrijving != null;
	const hasBoth = hasMaatregel && hasOmschrijving;
	const primaryLabel = maatregelOmschrijving ?? omschrijving ?? normalizeLabel(item.onderwerp) ?? '';

	return {
		maatregelOmschrijving,
		omschrijving,
		hasMaatregel,
		hasOmschrijving,
		hasBoth,
		primaryLabel,
	};
}

export function getReturnMeasureDisplayFromMeasure(measure: ReturnMeasure): ReturnMeasureDisplay {
	const maatregelOmschrijving = normalizeLabel(measure.maatregel?.omschrijving);
	const omschrijving = normalizeLabel(measure.omschrijving);
	const hasMaatregel = maatregelOmschrijving != null;
	const hasOmschrijving = omschrijving != null;
	const hasBoth = hasMaatregel && hasOmschrijving;
	const primaryLabel = maatregelOmschrijving ?? omschrijving ?? '';

	return {
		maatregelOmschrijving,
		omschrijving,
		hasMaatregel,
		hasOmschrijving,
		hasBoth,
		primaryLabel,
	};
}

export function returnMeasureToAgendaItem(measure: ReturnMeasure): AgendaItem {
	const display = getReturnMeasureDisplayFromMeasure(measure);

	return {
		id: measure.id,
		heeftInhoud: false,
		heeftAantekening: false,
		onderwijstijd: 0,
		subtype: 'nvt',
		heeftBijlagen: false,
		herhaalStatus: 'geen',
		begin: measure.begin,
		einde: measure.einde,
		onderwerp: display.primaryLabel,
		type: RETURN_MEASURE_AGENDA_TYPE,
		deelnames: [],
		vakken: [],
		locaties: [],
		links: measure.links,
		returnMeasureMaatregelOmschrijving: display.maatregelOmschrijving,
		returnMeasureOmschrijving: display.omschrijving,
	};
}

export function mergeAgendaWithReturnMeasures(
	agendaItems: AgendaItem[],
	returnMeasures: ReturnMeasure[],
): AgendaItem[] {
	const returnItems = returnMeasures.map(returnMeasureToAgendaItem);
	return [...agendaItems, ...returnItems].sort((a, b) => new Date(a.begin).getTime() - new Date(b.begin).getTime());
}
