import type { ReactNode } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';

type AsyncFetchStatusProps = {
	loading: boolean;
	error: string | null;
	errorMessage: string;
	onRetry: () => void;
};

export function asyncFetchStatus({ loading, error, errorMessage, onRetry }: AsyncFetchStatusProps): ReactNode {
	if (loading) {
		return (
			<div className="py-10">
				<LoadingSpinner />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center gap-2 py-10">
				<p className="text-sm text-destructive">
					{errorMessage}: {error}
				</p>
				<Button onClick={onRetry}>Opnieuw proberen</Button>
			</div>
		);
	}

	return null;
}
