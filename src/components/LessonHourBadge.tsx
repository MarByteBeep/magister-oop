import type { LessonInfo } from '@/lib/agendaUtils';
import { cn } from '@/lib/utils';

type LessonInfoBadgeProps = {
	lessonInfo: LessonInfo;
	className?: string;
};

function LessonHourBadge(props: LessonInfoBadgeProps) {
	return (
		<span
			className={cn(
				'inline-flex items-center justify-center h-6 w-6 bg-primary text-primary-foreground text-xs font-bold',
				props.className,
			)}
		>
			{props.lessonInfo.status === 'break' ? 'P' : props.lessonInfo.lesson}
		</span>
	);
}

export default LessonHourBadge;
