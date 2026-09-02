'use client';

import type { AbsenceRow } from '@/lib/absenceUtils';
import { findLessonEntry, isLessonEntry } from '@/lib/agendaEntryUtils';
import { formatTime, getDateKey, parseOptionalDate } from '@/lib/dateUtils';
import type { LessonAgendaEntry } from '@/magister/response/agenda-entry.types';
import type { Student } from '@/magister/types';
import LazyAvatar from '../LazyAvatar';
import LessonHourBadge from '../LessonHourBadge';
import AgendaTooltipContent from '../student/AgendaTooltipContent';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

function formatLessonRange(row: AbsenceRow) {
	if (row.lesuurBegin && row.lesuurEinde) {
		return row.lesuurBegin === row.lesuurEinde ? `${row.lesuurBegin}` : `${row.lesuurBegin}-${row.lesuurEinde}`;
	}
	return '-';
}

function resolveAgendaEntry(student: Student, row: AbsenceRow): LessonAgendaEntry | null {
	if (!row.begin) return null;

	const beginDate = parseOptionalDate(row.begin);
	if (!beginDate) return null;

	const dateKey = getDateKey(beginDate);
	const agendaForDay = student.agenda?.[dateKey];
	if (!agendaForDay?.length) return null;

	const lessonEntries = agendaForDay.filter(isLessonEntry);

	if (row.lesuurBegin) {
		const lesuurBegin = row.lesuurBegin;
		const lesuurEinde = row.lesuurEinde ?? lesuurBegin;
		const byHour =
			lessonEntries.find((entry) => entry.item.lesuur?.begin === lesuurBegin) ??
			lessonEntries.find(
				(entry) =>
					entry.item.lesuur?.begin &&
					entry.item.lesuur?.einde &&
					entry.item.lesuur.begin <= lesuurBegin &&
					entry.item.lesuur.einde >= lesuurEinde,
			);
		if (byHour) return byHour;
	}

	return findLessonEntry(beginDate, lessonEntries);
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

function AbsenceFallbackTooltipContent({ row }: { row: AbsenceRow }) {
	const beginTime = parseOptionalDate(row.begin);
	const endTime = parseOptionalDate(row.einde);

	return (
		<div className="space-y-1">
			<div>Lesuur: {formatLessonRange(row)}</div>
			{beginTime && endTime ? (
				<div>
					Tijd: {formatTime(beginTime)} - {formatTime(endTime)}
				</div>
			) : null}
		</div>
	);
}

function AbsenceHourIndicator({ row, student }: { row: AbsenceRow; student?: Student }) {
	const agendaEntry = student ? resolveAgendaEntry(student, row) : null;

	if (agendaEntry) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<span className="inline-flex">
						{row.lesuurBegin ? (
							<LessonHourBadge
								lessonInfo={{ status: 'lesson', lesson: row.lesuurBegin }}
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

	if (row.lesuurBegin) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<span className="inline-flex">
						<LessonHourBadge
							lessonInfo={{ status: 'lesson', lesson: row.lesuurBegin }}
							className="h-5 w-5 text-xs shrink-0"
						/>
					</span>
				</TooltipTrigger>
				<TooltipContent>
					<AbsenceFallbackTooltipContent row={row} />
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

interface AbsenceGroupRowProps {
	absences: AbsenceRow[];
	student?: Student;
	onSelectStudent: (studentId: number) => void;
}

export default function AbsenceGroupRow({ absences, student, onSelectStudent }: AbsenceGroupRowProps) {
	const first = absences[0];
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
				{absences.map((row) => (
					<AbsenceHourIndicator key={row.id} row={row} student={student} />
				))}
			</div>
		</button>
	);
}
