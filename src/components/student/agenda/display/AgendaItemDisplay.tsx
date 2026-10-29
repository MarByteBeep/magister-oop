'use client';

import { type MouseEvent, memo } from 'react';
import { LuRotateCw } from 'react-icons/lu';
import LoadingSpinner from '@/components/LoadingSpinner';
import AgendaItemDisplayContent from '@/components/student/agenda/display/AgendaItemDisplayContent';
import { Button } from '@/components/ui/button';
import { useAgendaItemDisplay } from '@/hooks/agenda/useAgendaItemDisplay';
import { useLoadAgendaForStudent } from '@/hooks/agenda/useLoadAgendaForStudent';
import { useStudentById } from '@/hooks/students/useStudentById';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';

interface AgendaItemDisplayProps {
	studentId: number;
	type: 'current' | 'next';
	lessonRange?: string;
}

function syncTitle(type: 'current' | 'next'): string {
	if (type === 'current') return 'Laad agenda voor vandaag (huidige les)';
	return 'Laad agenda voor vandaag (les in dit lesuur)';
}

function AgendaSyncPrompt({ type, onSync }: { type: 'current' | 'next'; onSync: (event: MouseEvent) => void }) {
	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={onSync}
			className="h-8 w-8 text-muted-foreground hover:text-primary"
			title={syncTitle(type)}
		>
			<LuRotateCw className="h-4 w-4" />
		</Button>
	);
}

function AgendaEmptyLesson() {
	return (
		<div className="flex items-center gap-1 text-muted-foreground">
			<span className="text-xs">Geen les</span>
		</div>
	);
}

function renderFetchedAgendaItem(
	agendaEntry: AgendaEntry | null | undefined,
	hasFetchedForToday: boolean,
	type: 'current' | 'next',
	handleSyncClick: (event: MouseEvent) => void,
) {
	if (agendaEntry) return <AgendaItemDisplayContent entry={agendaEntry} />;
	if (!hasFetchedForToday) return <AgendaSyncPrompt type={type} onSync={handleSyncClick} />;
	return <AgendaEmptyLesson />;
}

function renderAgendaItemDisplay(model: {
	isLoadingAgenda: boolean;
	agendaEntry: AgendaEntry | null | undefined;
	hasFetchedForToday: boolean;
	type: 'current' | 'next';
	handleSyncClick: (event: MouseEvent) => void;
}) {
	if (model.isLoadingAgenda) return <LoadingSpinner iconClassName="h-5 w-5" />;
	return renderFetchedAgendaItem(model.agendaEntry, model.hasFetchedForToday, model.type, model.handleSyncClick);
}

function AgendaItemDisplay({ studentId, type, lessonRange }: AgendaItemDisplayProps) {
	const loadAgendaForStudent = useLoadAgendaForStudent();
	const student = useStudentById(studentId);
	const { agendaEntry, isLoadingAgenda, hasFetchedForToday, handleSyncClick } = useAgendaItemDisplay(
		student,
		type,
		lessonRange,
		loadAgendaForStudent,
	);

	if (!student) return null;

	return renderAgendaItemDisplay({
		isLoadingAgenda,
		agendaEntry,
		hasFetchedForToday,
		type,
		handleSyncClick,
	});
}

export default memo(AgendaItemDisplay);
