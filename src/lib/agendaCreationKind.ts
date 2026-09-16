export type AgendaCreationKind = 'appointment' | 'return-measure';

export function isAgendaCreationKind(value: string): value is AgendaCreationKind {
	return value === 'appointment' || value === 'return-measure';
}
