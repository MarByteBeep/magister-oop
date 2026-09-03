'use client';

import { LuTriangleAlert } from 'react-icons/lu';
import { returnMeasureIconClasses } from '@/lib/agendaKindStyles';
import { cn } from '@/lib/utils';

interface ReturnMeasureAlertBadgeProps {
	className?: string;
}

export function ReturnMeasureAlertBadge({ className }: ReturnMeasureAlertBadgeProps) {
	return (
		<LuTriangleAlert
			className={cn('h-3 w-3 shrink-0', returnMeasureIconClasses, className)}
			aria-label="Aanvullende terugkomomschrijving"
		/>
	);
}
