'use client';

import type { AbsenceRow } from '@/lib/absenceUtils';
import { findAgendaItem, getAgendaItemInfo } from '@/lib/agendaUtils';
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

interface AbsenceGroupRowProps {
	row: AbsenceRow;
	student?: Student;
	onSelectStudent: (studentId: number) => void;
}

export default function AbsenceGroupRow({ row, student, onSelectStudent }: AbsenceGroupRowProps) {
	const clickable = Boolean(student);
	const agendaItem = student ? resolveAgendaItem(student, row) : null;
	const beginTime = parseDate(row.begin);
	const endTime = parseDate(row.einde);
	const { courseCodes, teachersCodes, subject } = agendaItem
		? getAgendaItemInfo(agendaItem)
		: { courseCodes: undefined, teachersCodes: undefined, subject: undefined };

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
					alt={row.studentName}
					initials={getInitials(row.studentName)}
					className="h-10 w-10"
				/>
				<div className="flex flex-col min-w-0">
					<span className="font-medium text-foreground truncate">
						{row.studentName}{' '}
						{row.classCode ? <span className="text-muted-foreground">({row.classCode})</span> : null}
					</span>
				</div>
			</div>
			{agendaItem ? (
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="flex items-center gap-1.5 shrink-0 max-w-[45%] overflow-hidden">
							{row.lesuurBegin ? (
								<LessonHourBadge
									lessonInfo={{ status: 'lesson', lesson: row.lesuurBegin }}
									className="h-5 w-5 text-xs shrink-0"
								/>
							) : null}
							{beginTime && endTime ? (
								<span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
									{formatTime(beginTime)}-{formatTime(endTime)}
								</span>
							) : null}
							<span className="text-xs font-semibold text-foreground truncate">
								{courseCodes ?? subject ?? ''}
							</span>
							{teachersCodes ? (
								<span className="text-xs text-muted-foreground truncate">{teachersCodes}</span>
							) : null}
						</div>
					</TooltipTrigger>
					<TooltipContent>
						<AgendaTooltipContent item={agendaItem} />
					</TooltipContent>
				</Tooltip>
			) : (
				<Badge variant="secondary" className="shrink-0 max-w-[45%]">
					les {formatLessonRange(row)}
				</Badge>
			)}
		</button>
	);
}
