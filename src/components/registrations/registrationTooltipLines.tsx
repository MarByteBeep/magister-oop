'use client';

import { formatTime } from '@/lib/shared/dateUtils';

export function OptionalTooltipLine({ show, children }: { show: boolean; children: string }) {
	if (!show) return null;
	return <div>{children}</div>;
}

export function TimeRangeTooltipLine({ begin, finish }: { begin: Date | null; finish: Date | null }) {
	if (begin === null) return null;
	if (finish === null) return null;

	return (
		<div>
			Tijd: {formatTime(begin)} - {formatTime(finish)}
		</div>
	);
}

export function authorizedLabel(isAuthorized: boolean): string {
	if (isAuthorized) return 'ja';
	return 'nee';
}
