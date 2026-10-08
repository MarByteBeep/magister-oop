'use client';

import { useEffect, useMemo, useRef } from 'react';
import { LuTriangleAlert } from 'react-icons/lu';
import ReturnMeasureRescheduleLegend from '@/components/return-measure/ReturnMeasureRescheduleLegend';
import Agenda from '@/components/student/agenda/Agenda';
import WeeklyAgendaNavigation from '@/components/student/agenda/WeeklyAgendaNavigation';
import WeeklyAgendaSkeleton from '@/components/student/agenda/WeeklyAgendaSkeleton';
import { useStableAgendaEntries } from '@/hooks/agenda/useStableAgendaEntries';
import { useReturnMeasureReschedulePlanner } from '@/hooks/return-measure/useReturnMeasureReschedulePlanner';
import { returnMeasureTextClasses } from '@/lib/agenda/kindStyles';
import type { CreateReturnMeasureFormInput } from '@/lib/return-measure/createRequest';
import {
	listRescheduleOverrideAlerts,
	type RescheduleOverrideAlert,
	type ReturnMeasureScheduleKind,
} from '@/lib/return-measure/reschedule';
import { formatReturnMeasureWhen } from '@/lib/return-measure/summary';
import { getStartOfWeek } from '@/lib/shared/dateUtils';
import { cn } from '@/lib/utils';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';

interface ReturnMeasureReschedulePlannerProps {
	measure: ReturnMeasureStudent;
	enabled: boolean;
	onPlanChange: (plan: CreateReturnMeasureFormInput | null) => void;
}

function scheduleKindLabel(kind: ReturnMeasureScheduleKind): string {
	switch (kind) {
		case 'full-day':
			return 'vierkant rooster';
		case 'pre-school':
			return '8 uur melden';
		case 'hour':
			return 'lesuur';
	}
}

function overrideAlertMessage(alert: RescheduleOverrideAlert): string {
	switch (alert.type) {
		case 'kind':
			return `Type wijkt af: was ${scheduleKindLabel(alert.from)}, nu ${scheduleKindLabel(alert.to)}.`;
		case 'duration':
			return `Duur wijkt af: was ${alert.fromMinutes} minuten, nu ${alert.toMinutes} minuten.`;
		case 'hourCount':
			return `Aantal lesuren wijkt af: was ${alert.from}, nu ${alert.to}.`;
		case 'overlapsLesson':
			return `Gepland tijdens lesuur: ${alert.subjects.join(', ')}`;
	}
}

export default function ReturnMeasureReschedulePlanner({
	measure,
	enabled,
	onPlanChange,
}: ReturnMeasureReschedulePlannerProps) {
	const planner = useReturnMeasureReschedulePlanner(measure, enabled);
	const stableEntries = useStableAgendaEntries(planner.calendarItems);
	const calendarDate = useMemo(() => getStartOfWeek(planner.selectedWeekDate), [planner.selectedWeekDate]);
	const onPlanChangeRef = useRef(onPlanChange);
	onPlanChangeRef.current = onPlanChange;

	useEffect(() => {
		onPlanChangeRef.current(planner.plan);
	}, [planner.plan]);

	if (!enabled) return null;

	if (!planner.bounds) {
		return (
			<p className="text-sm text-muted-foreground">
				Deze maatregel heeft geen gepland tijdstip; kies zelf een nieuw moment in de agenda.
			</p>
		);
	}

	const whenLabel = planner.selection ? formatReturnMeasureWhen(planner.selection) : null;
	const overrideAlerts =
		planner.selection == null
			? []
			: listRescheduleOverrideAlerts(
					planner.bounds.start,
					planner.bounds.end,
					planner.selection,
					planner.selectionDayEntries,
				);

	const selectionHint =
		'Kies een moment in de agenda. Suggestie volgt de oorspronkelijke vorm; je mag overriden (ander uur, duur, of over een les).';

	return (
		<div className="flex flex-col gap-2">
			{/* Explicit height: react-big-calendar collapses without a concrete pixel height. */}
			<div className="flex h-[520px] max-h-[calc(90vh-14rem)] flex-col rounded-md border">
				<WeeklyAgendaNavigation
					weekRangeText={planner.weekRangeText}
					isCurrentWeek={planner.isCurrentWeek}
					studentId={planner.studentId}
					syncRangeStart={planner.syncRange.start}
					syncRangeEnd={planner.syncRange.end}
					onPreviousWeek={planner.goToPreviousWeek}
					onNextWeek={planner.goToNextWeek}
					onCurrentWeek={planner.goToCurrentWeek}
					showCreateHint={false}
				/>
				<div className="min-h-0 flex-1 pt-2 pr-2 pb-2 pl-0">
					{planner.isLoading ? (
						<WeeklyAgendaSkeleton />
					) : (
						<div className="agenda-scroll-y h-full">
							<Agenda
								entries={stableEntries}
								date={calendarDate}
								view="work_week"
								onSelectEntry={() => {}}
								onSelectSlot={planner.handleSelectSlot}
								draftSelection={planner.selection}
								draftLabel={planner.description}
								selectionMode="always"
								highlightDateKey={planner.highlightDateKey}
								focusReturnMeasureId={measure.id}
								transformSelection={planner.transformSelection}
							/>
						</div>
					)}
				</div>
				<ReturnMeasureRescheduleLegend />
			</div>

			{whenLabel ? (
				<div className="space-y-1.5 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
					<p>
						Nieuwe terugkommaatregel:{' '}
						<span className={cn('font-medium', returnMeasureTextClasses)}>{whenLabel}</span>
					</p>
					{overrideAlerts.map((alert) => (
						<p key={alert.type} className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
							<LuTriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
							<span>{overrideAlertMessage(alert)}</span>
						</p>
					))}
				</div>
			) : (
				<p className="text-sm text-muted-foreground">{selectionHint}</p>
			)}
		</div>
	);
}
