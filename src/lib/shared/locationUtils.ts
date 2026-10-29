import { trimmedOrUndefined } from '@/lib/shared/stringUtils';
import type { AgendaItemLocation } from '@/magister/response/agenda.types';

export function formatLocation(location?: AgendaItemLocation | null) {
	const trimmed = trimmedOrUndefined(location?.code ?? location?.omschrijving);
	if (!trimmed) return undefined;

	return trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function formatLocations(locations: AgendaItemLocation[]) {
	const formatted = locations.map((location) => formatLocation(location)).filter(Boolean);
	return formatted.length > 0 ? formatted.join(', ') : undefined;
}
