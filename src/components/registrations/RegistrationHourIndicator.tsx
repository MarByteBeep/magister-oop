'use client';

import { formatLessonRange, resolveAgendaEntry } from '@/components/registrations/registrationGroupRowUtils';
import { TimeRangeTooltipLine } from '@/components/registrations/registrationTooltipLines';
import AgendaTooltipContent from '@/components/student/agenda/calendar/AgendaTooltipContent';
import LessonHourBadge from '@/components/student/agenda/calendar/LessonHourBadge';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { RegistrationRow } from '@/lib/registrations/utils';
import { parseOptionalDate } from '@/lib/shared/dateUtils';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';

function RegistrationFallbackTooltipContent({ row }: { row: RegistrationRow }) {
	return (
		<div className="space-y-1">
			<div>Lesuur: {formatLessonRange(row)}</div>
			<TimeRangeTooltipLine begin={parseOptionalDate(row.start)} finish={parseOptionalDate(row.end)} />
		</div>
	);
}

function LessonHourBadgeForRow({ hour }: { hour: number }) {
	return <LessonHourBadge lessonInfo={{ status: 'lesson', lesson: hour }} className="h-5 w-5 text-xs shrink-0" />;
}

function LessonRangeBadge({ row, className }: { row: RegistrationRow; className: string }) {
	return (
		<Badge variant="secondary" className={className}>
			les {formatLessonRange(row)}
		</Badge>
	);
}

function HourTrigger({ row }: { row: RegistrationRow }) {
	if (row.lessonHourStart === undefined) {
		return <LessonRangeBadge row={row} className="shrink-0 text-xs" />;
	}
	return <LessonHourBadgeForRow hour={row.lessonHourStart} />;
}

function AgendaHourTooltip({ row, agendaEntry }: { row: RegistrationRow; agendaEntry: AgendaEntry }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="inline-flex">
					<HourTrigger row={row} />
				</span>
			</TooltipTrigger>
			<TooltipContent>
				<AgendaTooltipContent entry={agendaEntry} />
			</TooltipContent>
		</Tooltip>
	);
}

function FallbackHourTooltip({ row, hour }: { row: RegistrationRow; hour: number }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="inline-flex">
					<LessonHourBadgeForRow hour={hour} />
				</span>
			</TooltipTrigger>
			<TooltipContent>
				<RegistrationFallbackTooltipContent row={row} />
			</TooltipContent>
		</Tooltip>
	);
}

function resolveAgendaEntryForStudent(student: Student | undefined, row: RegistrationRow) {
	if (!student) return null;
	return resolveAgendaEntry(student, row);
}

function renderWithoutAgenda(row: RegistrationRow) {
	const hour = row.lessonHourStart;
	if (hour !== undefined) return <FallbackHourTooltip row={row} hour={hour} />;
	return <LessonRangeBadge row={row} className="shrink-0 max-w-[45%]" />;
}

export default function RegistrationHourIndicator({ row, student }: { row: RegistrationRow; student?: Student }) {
	const agendaEntry = resolveAgendaEntryForStudent(student, row);
	if (agendaEntry) return <AgendaHourTooltip row={row} agendaEntry={agendaEntry} />;
	return renderWithoutAgenda(row);
}
