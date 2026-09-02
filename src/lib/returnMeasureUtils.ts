import type { ReturnMeasure } from '@/magister/response/return-measure.types';

export type ReturnMeasureDisplay = {
	maatregelOmschrijving: string | null;
	omschrijving: string | null;
	hasMaatregel: boolean;
	hasOmschrijving: boolean;
	hasBoth: boolean;
	primaryLabel: string;
};

function normalizeLabel(value: string | null | undefined): string | null {
	if (value == null) return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

export function getReturnMeasureDisplay(measure: ReturnMeasure): ReturnMeasureDisplay {
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
