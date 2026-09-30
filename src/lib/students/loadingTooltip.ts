import type { MagisterSessionStatus } from '@/lib/session/magisterSession';

export function studentsLoadingTooltip(session: MagisterSessionStatus, studentsNeedingAgendaCount: number): string {
	if (session === 'connecting') return 'Wachten tot Magister is ingelogd...';
	if (studentsNeedingAgendaCount > 0) return `${studentsNeedingAgendaCount} leerlingen nog te laden`;
	return 'Laden...';
}
