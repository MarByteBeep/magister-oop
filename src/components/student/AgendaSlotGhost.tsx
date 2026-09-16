import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import LessonHourBadge from '@/components/LessonHourBadge';
import { cn } from '@/lib/utils';

const agendaSlotGhostStyles = cva('mx-1 h-full rounded-lg border', {
	variants: {
		variant: {
			hover: 'border-dashed border-primary/40 bg-primary/8 dark:border-primary/45 dark:bg-primary/8',
			draft: 'border-primary/55 bg-primary/10 shadow-sm shadow-black/8 dark:border-primary/70 dark:bg-primary/22 dark:shadow-black/20',
		},
	},
	defaultVariants: {
		variant: 'hover',
	},
});

interface AgendaSlotGhostProps extends VariantProps<typeof agendaSlotGhostStyles> {
	lessonHour?: number;
	children?: React.ReactNode;
	className?: string;
}

export default function AgendaSlotGhost({ variant, lessonHour, children, className }: AgendaSlotGhostProps) {
	return (
		<div className={cn(agendaSlotGhostStyles({ variant }), className)}>
			<div className="flex h-full min-w-0 items-center gap-1 px-1.5">
				{lessonHour !== undefined && (
					<LessonHourBadge
						lessonInfo={{ status: 'lesson', lesson: lessonHour }}
						className="h-4 w-4 shrink-0 text-[0.65rem]"
					/>
				)}
				{children}
			</div>
		</div>
	);
}
