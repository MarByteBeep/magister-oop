import type { AgendaItemLocation } from '@/magister/response/agenda.types';

export function formatLocation(location?: AgendaItemLocation | null) {
	const raw = location?.code ?? location?.omschrijving;
	const trimmed = raw?.trim();
	if (!trimmed) return undefined;

	return trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function formatLocations(locations: AgendaItemLocation[]) {
	const formatted = locations.map((location) => formatLocation(location)).filter(Boolean);
	return formatted.length > 0 ? formatted.join(', ') : undefined;
}
