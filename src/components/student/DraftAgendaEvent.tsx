import type { CalendarEvent } from '@/lib/agendaCalendarUtils';
import { formatTime } from '@/lib/dateUtils';
import { formatLessonHoursCompact, getOverlappingLessonHoursForSelection } from '@/lib/lessonHours';

interface DraftAgendaEventProps {
	event: CalendarEvent;
}

export default function DraftAgendaEvent({ event }: DraftAgendaEventProps) {
	const lessonHours = getOverlappingLessonHoursForSelection(event);
	const lessonLabel = formatLessonHoursCompact(lessonHours);

	const label = lessonLabel
		? `${formatTime(event.start)} – ${formatTime(event.end)} · ${lessonLabel}`
		: `${formatTime(event.start)} – ${formatTime(event.end)}`;

	return (
		<div className="flex h-full items-start px-1.5 py-0.5 text-xs font-medium text-primary">
			<span className="truncate">{label}</span>
		</div>
	);
}
