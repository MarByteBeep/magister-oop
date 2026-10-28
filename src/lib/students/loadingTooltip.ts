export function studentsLoadingTooltip(studentsNeedingAgendaCount: number): string {
	if (studentsNeedingAgendaCount > 0) return `${studentsNeedingAgendaCount} leerlingen nog te laden`;
	return 'Laden...';
}
