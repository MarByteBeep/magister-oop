'use client';

import SyncButton from '@/components/SyncButton';
import { useLoadAgendaForStudent } from '@/hooks/agenda/useLoadAgendaForStudent';
import { useStudentById } from '@/hooks/students/useStudentById';
import { isAgendaRangeReady } from '@/lib/agenda/loadUtils';
import { getDateKey } from '@/lib/shared/dateUtils';
import { studentDataStore } from '@/lib/students/dataStore';
import type { Student } from '@/types/student.types';

export interface AgendaSyncButtonProps {
	studentId: number;
	rangeStart: Date;
	rangeEnd: Date;
	className?: string;
	tooltipReady?: string;
	tooltipLoading?: string;
}

function isRangeLoaded(student: Student, rangeStart: Date, rangeEnd: Date): boolean {
	return isAgendaRangeReady(student.agenda, rangeStart, rangeEnd, studentDataStore.getAbsenceNoticeLoad(student.id));
}

function syncTooltip(rangeLoaded: boolean, tooltipReady: string, tooltipLoading: string): string {
	if (rangeLoaded) return tooltipReady;
	return tooltipLoading;
}

function tooltipReadyLabel(value: string | undefined): string {
	if (value !== undefined) return value;
	return 'Agenda vernieuwen';
}

function tooltipLoadingLabel(value: string | undefined): string {
	if (value !== undefined) return value;
	return 'Agenda wordt geladen…';
}

export default function AgendaSyncButton(props: AgendaSyncButtonProps) {
	const tooltipReady = tooltipReadyLabel(props.tooltipReady);
	const tooltipLoading = tooltipLoadingLabel(props.tooltipLoading);
	const loadAgendaForStudent = useLoadAgendaForStudent();
	const student = useStudentById(props.studentId);
	if (!student) return null;

	const rangeLoaded = isRangeLoaded(student, props.rangeStart, props.rangeEnd);
	const rangeKey = `${props.studentId}_${getDateKey(props.rangeStart)}_${getDateKey(props.rangeEnd)}`;

	return (
		<SyncButton
			key={rangeKey}
			kind="diff"
			label={tooltipReady}
			tooltip={syncTooltip(rangeLoaded, tooltipReady, tooltipLoading)}
			disabled={!rangeLoaded}
			className={props.className}
			toast={{
				changed: 'Agenda gesynchroniseerd: gewijzigd rooster.',
				unchanged: 'Agenda gesynchroniseerd: geen wijzigingen.',
			}}
			onSync={async () => {
				const { changed } = await loadAgendaForStudent(student.id, props.rangeStart, props.rangeEnd, {
					refresh: true,
				});
				return { changed };
			}}
		/>
	);
}
