import { useEffect } from 'react';
import { syncActionBadge } from '@/lib/extension/actionBadge';

export function useActionBadge(count: number): void {
	useEffect(() => {
		syncActionBadge(count);
	}, [count]);
}
