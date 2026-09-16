import type { CalendarEvent } from '@/lib/agendaCalendarUtils';
import { formatTime } from '@/lib/dateUtils';
import { formatLessonHoursCompact, getOverlappingLessonHoursForSelection } from '@/lib/lessonHours';
import AgendaSlotGhost from './AgendaSlotGhost';

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
		<AgendaSlotGhost variant="draft" lessonHour={lessonHours[0]} className="text-xs font-medium text-primary">
			<span className="truncate py-0.5">{label}</span>
		</AgendaSlotGhost>
	);
}
