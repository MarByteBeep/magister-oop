import { LuClock, LuMapPin } from 'react-icons/lu';
import LessonHourBadge from '@/components/student/agenda/LessonHourBadge';
import type { RegistrationModalDisplay } from '@/lib/registrations/registrationModalDisplay';

export default function RegistrationModalDetails({ display }: { display: RegistrationModalDisplay }) {
	const { hour, subjectName, teachers, locations, lessonBegin, lessonEnd } = display;

	return (
		<div className="space-y-2 text-sm">
			<div className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
				{hour ? <LessonHourBadge label={hour} size="md" /> : null}
				<LuClock className="h-4 w-4 shrink-0" />
				<span className="font-medium text-foreground">
					{lessonBegin} - {lessonEnd}
				</span>
			</div>
			{subjectName ? <div className="font-medium text-foreground">{subjectName}</div> : null}
			{teachers ? <div className="text-foreground">{teachers}</div> : null}
			{locations ? (
				<div className="flex items-center gap-1.5 text-muted-foreground">
					<LuMapPin className="h-4 w-4 shrink-0" />
					<span className="text-foreground">{locations}</span>
				</div>
			) : null}
		</div>
	);
}
