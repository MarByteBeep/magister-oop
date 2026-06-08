'use client';

import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import AgendaSyncButton from './AgendaSyncButton';

interface WeeklyAgendaNavigationProps {
	weekRangeText: string;
	isCurrentWeek: boolean;
	studentId: number;
	syncRangeStart: Date;
	syncRangeEnd: Date;
	onPreviousWeek: () => void;
	onNextWeek: () => void;
	onCurrentWeek: () => void;
}

export default function WeeklyAgendaNavigation({
	weekRangeText,
	isCurrentWeek,
	studentId,
	syncRangeStart,
	syncRangeEnd,
	onPreviousWeek,
	onNextWeek,
	onCurrentWeek,
}: WeeklyAgendaNavigationProps) {
	return (
		<div className="flex items-center justify-between px-2 py-1 border-b shrink-0">
			<Button variant="ghost" size="icon" onClick={onPreviousWeek} title="Vorige week">
				<LuChevronLeft className="h-5 w-5" />
			</Button>

			<div className="flex items-center gap-2">
				<span className="text-sm font-medium">{weekRangeText}</span>
				{!isCurrentWeek && (
					<Button variant="outline" size="sm" onClick={onCurrentWeek} className="text-xs h-7">
						Vandaag
					</Button>
				)}
			</div>

			<div className="flex items-center gap-0.5 shrink-0">
				<AgendaSyncButton
					studentId={studentId}
					rangeStart={syncRangeStart}
					rangeEnd={syncRangeEnd}
					tooltipReady="Vernieuw rooster voor deze week"
					tooltipLoading="Rooster wordt geladen…"
				/>
				<Button variant="ghost" size="icon" onClick={onNextWeek} title="Volgende week">
					<LuChevronRight className="h-5 w-5" />
				</Button>
			</div>
		</div>
	);
}
