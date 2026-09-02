'use client';

import { useEffect, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudentsContext } from '@/context/StudentsContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { findActiveEntryPreferringLessons } from '@/lib/agendaEntryUtils';
import { isAgendaDayLoaded, needsAgendaDayFetch } from '@/lib/agendaLoadUtils';
import { getDateKey, getNow } from '@/lib/dateUtils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import type { Student } from '@/magister/types';
import Agenda from './Agenda';
import AgendaItemModal from './AgendaItemModal';

interface DailyAgendaViewProps {
	studentId: number;
	onOpenStudent?: (student: Student) => void;
}

export default function DailyAgendaView({ studentId, onOpenStudent }: DailyAgendaViewProps) {
	const currentTime = useCurrentTime();

	const { students, loadAgendaForStudent } = useStudentsContext();
	const student = students.find((s) => s.id === studentId);

	const todayKey = useMemo(() => getDateKey(currentTime), [currentTime]);
	const agendaFromContext = student?.agenda?.[todayKey];

	const [bootstrapAgenda, setBootstrapAgenda] = useState<AgendaEntry[] | undefined>(undefined);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedEntry, setSelectedEntry] = useState<AgendaEntry | null>(null);

	useEffect(() => {
		if (!student) {
			setBootstrapAgenda(undefined);
			setIsLoading(false);
			return;
		}

		if (!needsAgendaDayFetch(student, todayKey)) {
			setBootstrapAgenda(undefined);
			setIsLoading(false);
			return;
		}

		let cancelled = false;
		setIsLoading(!isAgendaDayLoaded(student, todayKey));
		const now = getNow();
		loadAgendaForStudent(student.id, now, now)
			.then(({ entries }) => {
				if (!cancelled) setBootstrapAgenda(entries);
			})
			.catch((err) => console.error('Failed to load agenda:', err))
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [
		student,
		student?.agenda,
		student?.returnMeasuresLoadedFor,
		student?.absenceNoticesLoadedFor,
		todayKey,
		loadAgendaForStudent,
	]);

	const agendaEntries: AgendaEntry[] | undefined =
		agendaFromContext !== undefined ? agendaFromContext : bootstrapAgenda;

	const activeEntry = findActiveEntryPreferringLessons(currentTime, agendaEntries || []);

	if (isLoading) {
		return (
			<div className="space-y-2 p-5">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
		);
	}

	if (!agendaEntries || agendaEntries.length === 0) {
		return <p className="text-muted-foreground text-center py-4">Geen lessen gepland voor vandaag.</p>;
	}

	return (
		<>
			<div className="h-full pt-2 pr-2 pb-2 pl-2">
				<Agenda
					entries={agendaEntries}
					date={currentTime}
					view="day"
					activeEntry={activeEntry}
					onSelectEntry={(entry) => setSelectedEntry(entry)}
				/>
			</div>

			{selectedEntry && (
				<AgendaItemModal
					entry={selectedEntry}
					isOpen={selectedEntry !== null}
					onClose={() => setSelectedEntry(null)}
					onOpenStudent={onOpenStudent}
				/>
			)}
		</>
	);
}
