'use client';

import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { LuRotateCw } from 'react-icons/lu';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useStudentsContext } from '@/context/StudentsContext';
import { getDateKey } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import type { Student } from '@/magister/types';

const MIN_SPINNER_MS = 320;

function isAgendaLoadedForRange(agenda: Student['agenda'], rangeStart: Date, rangeEnd: Date): boolean {
	const currentDate = new Date(rangeStart);
	while (currentDate <= rangeEnd) {
		const key = getDateKey(currentDate);
		if (agenda?.[key] === undefined) return false;
		currentDate.setDate(currentDate.getDate() + 1);
	}
	return true;
}

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
	const [isSyncing, setIsSyncing] = useState(false);
	const { students, loadAgendaForStudent } = useStudentsContext();

	const student = students.find((s) => s.id === studentId);
	const rangeLoaded = student ? isAgendaLoadedForRange(student.agenda, rangeStart, rangeEnd) : false;
	const rangeKey = `${getDateKey(rangeStart)}_${getDateKey(rangeEnd)}`;

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset spinner when student or range changes
	useEffect(() => {
		setIsSyncing(false);
	}, [studentId, rangeKey]);

	const handleSync = async () => {
		if (!student || isSyncing || !rangeLoaded) return;
		const startedAt = performance.now();
		flushSync(() => {
			setIsSyncing(true);
		});
		try {
			const { changed } = await loadAgendaForStudent(student.id, rangeStart, rangeEnd);
			if (changed) {
				toast.success('Agenda gesynchroniseerd: gewijzigd rooster.');
			} else {
				toast.message('Agenda gesynchroniseerd: geen wijzigingen.');
			}
		} catch (err) {
			console.error('Failed to refresh agenda:', err);
		} finally {
			const elapsed = performance.now() - startedAt;
			if (elapsed < MIN_SPINNER_MS) {
				await new Promise((resolve) => setTimeout(resolve, MIN_SPINNER_MS - elapsed));
			}
			setIsSyncing(false);
		}
	};

	if (!student) return null;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className={cn(
						'h-8 w-8 shrink-0 text-muted-foreground hover:text-primary disabled:opacity-100',
						className,
					)}
					disabled={!rangeLoaded}
					aria-busy={isSyncing}
					aria-label={tooltipReady}
					onClick={() => void handleSync()}
				>
					<span className={cn('inline-flex transition-none', isSyncing && 'animate-spin')}>
						<LuRotateCw className="h-4 w-4" />
					</span>
				</Button>
			</TooltipTrigger>
			<TooltipContent>{rangeLoaded ? tooltipReady : tooltipLoading}</TooltipContent>
		</Tooltip>
	);
}
