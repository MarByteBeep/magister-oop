import type { MagisterSessionStatus } from '@/lib/session/magisterSession';

export function isStudentsLoading(
	session: MagisterSessionStatus,
	loading: boolean,
	studentsNeedingAgendaCount: number,
): boolean {
	return session === 'connecting' || loading || studentsNeedingAgendaCount > 0;
}
