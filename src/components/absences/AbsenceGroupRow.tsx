'use client';

import type { AbsenceRow } from '@/lib/absenceUtils';
import { findAgendaItem } from '@/lib/agendaUtils';
import { formatTime, getDateKey } from '@/lib/dateUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';
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

function parseDate(value?: string) {
	if (!value) return null;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
}

function resolveAgendaItem(student: Student, row: AbsenceRow): AgendaItem | null {
	if (!row.begin) return null;

	const beginDate = new Date(row.begin);
	if (Number.isNaN(beginDate.getTime())) return null;

	const dateKey = getDateKey(beginDate);
	const agendaForDay = student.agenda?.[dateKey];
	if (!agendaForDay?.length) return null;

	if (row.lesuurBegin) {
		const lesuurBegin = row.lesuurBegin;
		const lesuurEinde = row.lesuurEinde ?? lesuurBegin;
		const byHour =
			agendaForDay.find((it) => it.lesuur?.begin === lesuurBegin) ??
			agendaForDay.find(
				(it) =>
					it.lesuur?.begin &&
					it.lesuur?.einde &&
					it.lesuur.begin <= lesuurBegin &&
					it.lesuur.einde >= lesuurEinde,
			);
		if (byHour) return byHour;
	}

	return findAgendaItem(beginDate, agendaForDay);
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
	const beginTime = parseDate(row.begin);
	const endTime = parseDate(row.einde);

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

function AbsenceHourIndicator({
	row,
	student,
}: {
	row: AbsenceRow;
	student?: Student;
}) {
	const agendaItem = student ? resolveAgendaItem(student, row) : null;

	if (agendaItem) {
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
					<AgendaTooltipContent item={agendaItem} />
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
				{absences.map((row, idx) => (
					<AbsenceHourIndicator key={`${row.lesuurBegin}-${row.lesuurEinde}-${row.begin}-${idx}`} row={row} student={student} />
				))}
			</div>
		</button>
	);
}
