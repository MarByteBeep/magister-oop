import { cva, type VariantProps } from 'class-variance-authority';
import type { LessonInfo } from '@/lib/agenda/utils';
import { cn } from '@/lib/utils';

const lessonHourBadgeStyles = cva(
	'inline-flex shrink-0 items-center justify-center bg-primary font-bold text-primary-foreground',
	{
		variants: {
			size: {
				sm: 'h-3.5 w-3.5 text-[0.55rem]',
				md: 'h-4 w-4 text-[0.65rem]',
				lg: 'h-6 w-6 text-xs',
			},
		},
		defaultVariants: {
			size: 'lg',
		},
	},
);

type LessonHourBadgeProps = VariantProps<typeof lessonHourBadgeStyles> & {
	lessonInfo?: LessonInfo;
	/** Lesson hour when there is no {@link LessonInfo}. */
	hour?: number;
	/** Overrides the hour, for a range such as `5-6`. */
	label?: string;
	className?: string;
};

function badgeText(lessonInfo: LessonInfo | undefined, hour: number | undefined, label: string | undefined) {
	if (label) return label;
	if (lessonInfo?.status === 'break') return 'P';
	if (lessonInfo?.lesson != null) return lessonInfo.lesson;
	return hour;
}

function LessonHourBadge({ lessonInfo, hour, label, size, className }: LessonHourBadgeProps) {
	const text = badgeText(lessonInfo, hour, label);
	if (text == null || text === '') return null;

	return <span className={cn(lessonHourBadgeStyles({ size }), className)}>{text}</span>;
}

export default LessonHourBadge;
