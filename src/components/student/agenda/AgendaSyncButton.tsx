'use client';

import SyncButton from '@/components/SyncButton';
import { useLoadAgendaForStudent } from '@/hooks/agenda/useLoadAgendaForStudent';
import { useStudentById } from '@/hooks/students/useStudentById';
import { isAgendaRangeReady } from '@/lib/agenda/loadUtils';
import { getDateKey } from '@/lib/shared/dateUtils';
import { studentDataStore } from '@/lib/students/dataStore';

export interface AgendaSyncButtonProps {
	studentId: number;
	rangeStart: Date;
	rangeEnd: Date;
	className?: string;
	tooltipReady?: string;
	tooltipLoading?: string;
}

export default function AgendaSyncButton({
	studentId,
	rangeStart,
	rangeEnd,
	className,
	tooltipReady = 'Agenda vernieuwen',
	tooltipLoading = 'Agenda wordt geladen…',
}: AgendaSyncButtonProps) {
	const loadAgendaForStudent = useLoadAgendaForStudent();
	const student = useStudentById(studentId);
	const rangeLoaded = student
		? isAgendaRangeReady(student.agenda, rangeStart, rangeEnd, studentDataStore.getAbsenceNoticeLoad(student.id))
		: false;
	const rangeKey = `${studentId}_${getDateKey(rangeStart)}_${getDateKey(rangeEnd)}`;

	if (!student) return null;

	return (
		<SyncButton
			key={rangeKey}
			kind="diff"
			label={tooltipReady}
			tooltip={rangeLoaded ? tooltipReady : tooltipLoading}
			disabled={!rangeLoaded}
			className={className}
			toast={{
				changed: 'Agenda gesynchroniseerd: gewijzigd rooster.',
				unchanged: 'Agenda gesynchroniseerd: geen wijzigingen.',
			}}
			onSync={async () => {
				const { changed } = await loadAgendaForStudent(student.id, rangeStart, rangeEnd, { refresh: true });
				return { changed };
			}}
		/>
	);
}
