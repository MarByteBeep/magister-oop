import { LuClock, LuGraduationCap, LuMapPin } from 'react-icons/lu';
import LessonHourBadge from '@/components/student/agenda/calendar/LessonHourBadge';
import type { RegistrationModalDisplay } from '@/lib/registrations/registrationModalDisplay';
import { trimmedOrUndefined } from '@/lib/shared/stringUtils';

function HourBadge({ hour }: { hour: string | null | undefined }) {
	const label = trimmedOrUndefined(hour);
	if (!label) return null;
	return <LessonHourBadge label={label} size="md" />;
}

function DetailLine({ value }: { value: string | undefined }) {
	if (!value) return null;
	return <div className="font-medium text-foreground">{value}</div>;
}

function TeachersLine({ teachers }: { teachers: string | undefined }) {
	if (!teachers) return null;
	return (
		<div className="flex items-center gap-1.5 text-muted-foreground">
			<LuGraduationCap className="h-4 w-4 shrink-0" />
			<span className="text-foreground">{teachers}</span>
		</div>
	);
}

function LocationsLine({ locations }: { locations: string | undefined }) {
	if (!locations) return null;
	return (
		<div className="flex items-center gap-1.5 text-muted-foreground">
			<LuMapPin className="h-4 w-4 shrink-0" />
			<span className="text-foreground">{locations}</span>
		</div>
	);
}

export default function RegistrationModalDetails({ display }: { display: RegistrationModalDisplay }) {
	return (
		<div className="space-y-2 text-sm">
			<div className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
				<HourBadge hour={display.hour} />
				<LuClock className="h-4 w-4 shrink-0" />
				<span className="font-medium text-foreground">
					{display.lessonBegin} - {display.lessonEnd}
				</span>
			</div>
			<DetailLine value={display.subjectName} />
			<TeachersLine teachers={display.teachers} />
			<LocationsLine locations={display.locations} />
		</div>
	);
}
