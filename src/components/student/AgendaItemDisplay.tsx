'use client';

import { LuRotateCw } from 'react-icons/lu';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useStudentsContext } from '@/context/StudentsContext';
import { useAgendaItemDisplay } from '@/hooks/useAgendaItemDisplay';
import AgendaItemDisplayContent from './AgendaItemDisplayContent';

interface AgendaItemDisplayProps {
	studentId: number;
	type: 'current' | 'next';
	lessonRange?: string;
}

export default function AgendaItemDisplay({ studentId, type, lessonRange }: AgendaItemDisplayProps) {
	const { students, loadAgendaForStudent } = useStudentsContext();
	const student = students.find((s) => s.id === studentId);
	const { agendaItem, isLoadingAgenda, hasFetchedForToday, handleSyncClick } = useAgendaItemDisplay(
		student,
		type,
		lessonRange,
		loadAgendaForStudent,
	);

	if (!student) return null;
	if (isLoadingAgenda) return <LoadingSpinner iconClassName="h-5 w-5" />;
	if (agendaItem) return <AgendaItemDisplayContent item={agendaItem} />;

	if (!hasFetchedForToday) {
		return (
			<Button
				variant="ghost"
				size="icon"
				onClick={handleSyncClick}
				className="h-8 w-8 text-muted-foreground hover:text-primary"
				title={`Laad agenda voor vandaag (${type === 'current' ? 'huidige les' : 'les in dit lesuur'})`}
			>
				<LuRotateCw className="h-4 w-4" />
			</Button>
		);
	}

	return (
		<div className="flex items-center gap-1 text-muted-foreground">
			<span className="text-xs">Geen les</span>
		</div>
	);
}
