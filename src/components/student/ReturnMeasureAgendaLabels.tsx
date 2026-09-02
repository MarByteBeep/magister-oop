'use client';

import { LuTriangleAlert } from 'react-icons/lu';
import { getReturnMeasureDisplay } from '@/lib/returnMeasureUtils';
import { cn } from '@/lib/utils';
import type { AgendaItem } from '@/magister/response/agenda.types';

interface ReturnMeasureAgendaLabelsProps {
	item: AgendaItem;
	canWrapTitle?: boolean;
	compact?: boolean;
}

export default function ReturnMeasureAgendaLabels({
	item,
	canWrapTitle = false,
	compact = false,
}: ReturnMeasureAgendaLabelsProps) {
	const display = getReturnMeasureDisplay(item);
	const titleClasses = cn(
		'min-w-0 font-semibold text-foreground',
		canWrapTitle ? 'line-clamp-2 whitespace-normal break-words leading-tight' : 'truncate',
	);
	const secondaryClasses = cn(
		'min-w-0 text-[10px] text-muted-foreground',
		canWrapTitle ? 'line-clamp-2 whitespace-normal break-words leading-tight' : 'truncate',
	);

	return (
		<div className={cn('flex min-w-0 flex-col', compact ? 'gap-0' : 'gap-0.5')}>
			{display.hasMaatregel && <span className={titleClasses}>{display.maatregelOmschrijving}</span>}
			{display.hasOmschrijving && (
				<span className={cn(secondaryClasses, !display.hasMaatregel && titleClasses)}>
					{display.hasBoth && (
						<LuTriangleAlert
							className="mr-0.5 inline h-2.5 w-2.5 shrink-0 align-[-0.125em] text-amber-600 dark:text-amber-400"
							aria-hidden
						/>
					)}
					{display.omschrijving}
				</span>
			)}
		</div>
	);
}

interface ReturnMeasureAlertBadgeProps {
	className?: string;
}

export function ReturnMeasureAlertBadge({ className }: ReturnMeasureAlertBadgeProps) {
	return (
		<LuTriangleAlert
			className={cn('h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400', className)}
			aria-label="Aanvullende terugkomomschrijving"
		/>
	);
}
