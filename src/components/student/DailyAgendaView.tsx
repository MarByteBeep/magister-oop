'use client';

import { useEffect, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudentsContext } from '@/context/StudentsContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { findAgendaItem } from '@/lib/agendaUtils';
import { getDateKey, getNow } from '@/lib/dateUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import Agenda from './Agenda';
import AgendaItemModal from './AgendaItemModal';

interface DailyAgendaViewProps {
	studentId: number;
}

export default function DailyAgendaView({ studentId }: DailyAgendaViewProps) {
	const currentTime = useCurrentTime();

	const { students, loadAgendaForStudent } = useStudentsContext();
	const student = students.find((s) => s.id === studentId);

	const todayKey = useMemo(() => getDateKey(currentTime), [currentTime]);
	const agendaFromContext = student?.agenda?.[todayKey];

	const [bootstrapAgenda, setBootstrapAgenda] = useState<AgendaItem[] | undefined>(undefined);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);

	useEffect(() => {
		if (!student) {
			setBootstrapAgenda(undefined);
			setIsLoading(false);
			return;
		}

		if (student.agenda?.[todayKey] !== undefined) {
			setBootstrapAgenda(undefined);
			setIsLoading(false);
			return;
		}

		let cancelled = false;
		setIsLoading(true);
		const now = getNow();
		loadAgendaForStudent(student.id, now, now)
			.then(({ items }) => {
				if (!cancelled) setBootstrapAgenda(items);
			})
			.catch((err) => console.error('Failed to load agenda:', err))
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [student, student?.agenda, todayKey, loadAgendaForStudent]);

	const agendaItems: AgendaItem[] | undefined = agendaFromContext !== undefined ? agendaFromContext : bootstrapAgenda;

	const activeAgendaItem = findAgendaItem(currentTime, agendaItems || []);

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

	if (!agendaItems || agendaItems.length === 0) {
		return <p className="text-muted-foreground text-center py-4">Geen lessen gepland voor vandaag.</p>;
	}

	return (
		<>
			<div className="h-full pt-2 pr-2 pb-2 pl-2">
				<Agenda
					items={agendaItems}
					date={currentTime}
					view="day"
					activeItemId={activeAgendaItem?.id ?? null}
					onSelectItem={(item) => setSelectedItem(item)}
				/>
			</div>

			{selectedItem && (
				<AgendaItemModal
					item={selectedItem}
					isOpen={selectedItem !== null}
					onClose={() => setSelectedItem(null)}
				/>
			)}
		</>
	);
}
