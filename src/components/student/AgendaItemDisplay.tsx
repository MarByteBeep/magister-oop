'use client';

import { useCallback, useEffect, useState } from 'react';
import { LuRotateCw } from 'react-icons/lu';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useStudentsContext } from '@/context/StudentsContext';
import { findAgendaItem, findNextAgendaItem, getAgendaItemInfo } from '@/lib/agendaUtils';
import { getDateKey, getNow } from '@/lib/dateUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import AgendaTooltipContent from './AgendaTooltipContent';

interface AgendaItemDisplayProps {
	studentId: number;
	type: 'current' | 'next';
}

export default function AgendaItemDisplay({ studentId, type }: AgendaItemDisplayProps) {
	const { students, loadAgendaForStudent } = useStudentsContext();
	const student = students.find((s) => s.id === studentId);
	const [agendaItem, setAgendaItem] = useState<AgendaItem | null>(null);
	const [isLoadingAgenda, setIsLoadingAgenda] = useState(false);
	const [hasFetchedForToday, setHasFetchedForToday] = useState(false);

	const findRelevantAgendaItem = useCallback(
		(items: AgendaItem[], date: Date) => {
			return type === 'current' ? findAgendaItem(date, items) : findNextAgendaItem(date, items);
		},
		[type],
	);

	useEffect(() => {
		if (!student) return;

		const now = getNow();
		const todayKey = getDateKey(now);

		const agendaForToday = student.agenda?.[todayKey];
		if (agendaForToday !== undefined) {
			// agendaForToday can be an empty array, which means "loaded but no lessons"
			setAgendaItem(findRelevantAgendaItem(agendaForToday, getNow()));
			setHasFetchedForToday(true);
		} else {
			// agendaForToday is undefined, which means "not loaded yet"
			setAgendaItem(null);
			setHasFetchedForToday(false);
		}
	}, [student?.agenda, student, findRelevantAgendaItem]);

	const handleSyncClick = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!student || isLoadingAgenda) return;

		setIsLoadingAgenda(true);
		try {
			const now = getNow();
			const items = await loadAgendaForStudent(student.id, now, now);
			setAgendaItem(findRelevantAgendaItem(items, now));
			setHasFetchedForToday(true);
		} catch (error) {
			console.error('Failed to load agenda:', error);
		} finally {
			setIsLoadingAgenda(false);
		}
	};

	if (!student) return null;

	if (isLoadingAgenda) return <LoadingSpinner iconClassName="h-5 w-5" />;

	if (agendaItem) {
		const { locations, courseCodes, teachersCodes, subject } = getAgendaItemInfo(agendaItem);

		return (
			<div className="flex flex-col items-start text-left w-full min-w-0">
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="flex flex-col w-full min-w-0">
							<div className="w-full min-w-0 truncate">
								<span className="font-medium text-foreground">{courseCodes ?? subject}</span>
								{locations && <span className="text-muted-foreground"> ({locations})</span>}
							</div>

							<div className="w-full min-w-0 truncate">
								<span className="text-xs text-muted-foreground">{teachersCodes}</span>
							</div>
						</div>
					</TooltipTrigger>

					<TooltipContent>
						<AgendaTooltipContent item={agendaItem} />
					</TooltipContent>
				</Tooltip>
			</div>
		);
	}

	if (!hasFetchedForToday) {
		return (
			<Button
				variant="ghost"
				size="icon"
				onClick={handleSyncClick}
				className="h-8 w-8 text-muted-foreground hover:text-primary"
				title={`Laad agenda voor vandaag (${type === 'current' ? 'huidige' : 'volgende'})`}
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
