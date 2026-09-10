'use client';

import { findLessonEntry, isLessonEntry } from '@/lib/agendaEntryUtils';
import { formatTime, getDateKey, parseOptionalDate } from '@/lib/dateUtils';
import type { RegistrationRow } from '@/lib/registrationsUtils';
import type { LessonAgendaEntry } from '@/magister/response/agenda-entry.types';
import type { Student } from '@/magister/types';
import LazyAvatar from '../LazyAvatar';
import LessonHourBadge from '../LessonHourBadge';
import AgendaTooltipContent from '../student/AgendaTooltipContent';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

function formatLessonRange(row: RegistrationRow) {
	const { lessonHourStart, lessonHourEnd } = row;
	if (lessonHourStart && lessonHourEnd) {
		return lessonHourStart === lessonHourEnd ? `${lessonHourStart}` : `${lessonHourStart}-${lessonHourEnd}`;
	}
	return '-';
}

function resolveAgendaEntry(student: Student, row: RegistrationRow): LessonAgendaEntry | null {
	if (!row.start) return null;

	const startDate = parseOptionalDate(row.start);
	if (!startDate) return null;

	const dateKey = getDateKey(startDate);
	const agendaForDay = student.agenda?.[dateKey];
	if (!agendaForDay?.length) return null;

	const lessonEntries = agendaForDay.filter(isLessonEntry);

	if (row.lessonHourStart) {
		const lessonHourStart = row.lessonHourStart;
		const lessonHourEnd = row.lessonHourEnd ?? lessonHourStart;
		const byHour =
			lessonEntries.find((entry) => entry.item.lesuur?.begin === lessonHourStart) ??
			lessonEntries.find(
				(entry) =>
					entry.item.lesuur?.begin &&
					entry.item.lesuur?.einde &&
					entry.item.lesuur.begin <= lessonHourStart &&
					entry.item.lesuur.einde >= lessonHourEnd,
			);
		if (byHour) return byHour;
	}

	return findLessonEntry(startDate, lessonEntries);
}

function getInitials(studentName: string) {
	return studentName
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((p) => p.charAt(0))
		.join('')
		.toUpperCase();
}

function RegistrationFallbackTooltipContent({ row }: { row: RegistrationRow }) {
	const startTime = parseOptionalDate(row.start);
	const endTime = parseOptionalDate(row.end);

	return (
		<div className="space-y-1">
			<div>Lesuur: {formatLessonRange(row)}</div>
			{startTime && endTime ? (
				<div>
					Tijd: {formatTime(startTime)} - {formatTime(endTime)}
				</div>
			) : null}
		</div>
	);
}

function RegistrationHourIndicator({ row, student }: { row: RegistrationRow; student?: Student }) {
	const agendaEntry = student ? resolveAgendaEntry(student, row) : null;

	if (agendaEntry) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<span className="inline-flex">
						{row.lessonHourStart ? (
							<LessonHourBadge
								lessonInfo={{ status: 'lesson', lesson: row.lessonHourStart }}
								className="h-5 w-5 text-xs shrink-0"
							/>
						) : (
							<Badge variant="secondary" className="shrink-0 text-xs">
								les {formatLessonRange(row)}
							</Badge>
						)}
					</span>
				</TooltipTrigger>
				<TooltipContent>
					<AgendaTooltipContent entry={agendaEntry} />
				</TooltipContent>
			</Tooltip>
		);
	}

	if (row.lessonHourStart) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<span className="inline-flex">
						<LessonHourBadge
							lessonInfo={{ status: 'lesson', lesson: row.lessonHourStart }}
							className="h-5 w-5 text-xs shrink-0"
						/>
					</span>
				</TooltipTrigger>
				<TooltipContent>
					<RegistrationFallbackTooltipContent row={row} />
				</TooltipContent>
			</Tooltip>
		);
	}

	return (
		<Badge variant="secondary" className="shrink-0 max-w-[45%]">
			les {formatLessonRange(row)}
		</Badge>
	);
}

interface RegistrationGroupRowProps {
	registrations: RegistrationRow[];
	student?: Student;
	onSelectStudent: (studentId: number) => void;
}

export default function RegistrationGroupRow({ registrations, student, onSelectStudent }: RegistrationGroupRowProps) {
	const first = registrations[0];
	if (!first) return null;

	const clickable = Boolean(student);

	return (
		<button
			type="button"
			disabled={!clickable}
			className={[
				'flex items-center justify-between gap-3 p-2 border rounded-md bg-muted/50 text-left',
				clickable ? 'hover:bg-muted cursor-pointer' : 'opacity-60 cursor-not-allowed',
			].join(' ')}
			onClick={() => {
				if (student) onSelectStudent(student.id);
			}}
		>
			<div className="flex items-center gap-3 min-w-0">
				<LazyAvatar
					src={student?.links.foto?.href || undefined}
					alt={first.studentName}
					initials={getInitials(first.studentName)}
					className="h-10 w-10"
				/>
				<div className="flex flex-col min-w-0">
					<span className="font-medium text-foreground truncate">
						{first.studentName}{' '}
						{first.classCode ? <span className="text-muted-foreground">({first.classCode})</span> : null}
					</span>
				</div>
			</div>
			<div className="flex items-center gap-1 shrink-0">
				{registrations.map((row) => (
					<RegistrationHourIndicator key={row.id} row={row} student={student} />
				))}
			</div>
		</button>
	);
}
