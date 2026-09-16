import { useEffect } from 'react';
import { syncActionBadge } from '@/lib/actionBadge';

export function useActionBadge(count: number): void {
	useEffect(() => {
		syncActionBadge(count);
	}, [count]);
}
