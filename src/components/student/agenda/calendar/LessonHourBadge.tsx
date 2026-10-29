import { cva, type VariantProps } from 'class-variance-authority';
import type { LessonInfo } from '@/lib/agenda/utils';
import { cn } from '@/lib/utils';

function lessonNumberOrHour(lesson: number | undefined, hour: number | undefined): number | undefined {
	if (lesson !== undefined) return lesson;
	return hour;
}

function badgeTextFromLesson(lessonInfo: LessonInfo, hour: number | undefined): string | number | undefined {
	if (lessonInfo.status === 'break') return 'P';
	return lessonNumberOrHour(lessonInfo.lesson, hour);
}

function badgeTextFromOptionalLesson(
	lessonInfo: LessonInfo | undefined,
	hour: number | undefined,
): string | number | undefined {
	if (lessonInfo === undefined) return hour;
	return badgeTextFromLesson(lessonInfo, hour);
}

function badgeText(
	lessonInfo: LessonInfo | undefined,
	hour: number | undefined,
	label: string | undefined,
): string | number | undefined {
	if (label !== undefined) return label;
	return badgeTextFromOptionalLesson(lessonInfo, hour);
}

function hasBadgeText(text: string | number | undefined): text is string | number {
	if (text === undefined) return false;
	if (text === '') return false;
	return true;
}

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

export type LessonHourBadgeProps = VariantProps<typeof lessonHourBadgeStyles> & {
	lessonInfo?: LessonInfo;
	/** Lesson hour when there is no {@link LessonInfo}. */
	hour?: number;
	/** Overrides the hour, for a range such as `5-6`. */
	label?: string;
	className?: string;
};

function LessonHourBadge({ lessonInfo, hour, label, size, className }: LessonHourBadgeProps) {
	const text = badgeText(lessonInfo, hour, label);
	if (!hasBadgeText(text)) return null;

	return <span className={cn(lessonHourBadgeStyles({ size }), className)}>{text}</span>;
}

export default LessonHourBadge;
