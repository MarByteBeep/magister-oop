import { createContext, useContext } from 'react';
import type { ReturnMeasureStudent } from '@/magister/response/return-measure.types';

export interface ReturnMeasuresState {
	data: ReturnMeasureStudent[] | null;
	loading: boolean;
	refreshing: boolean;
	error: string | null;
	/** Measures planned for today that have not been handled yet. */
	openTodayCount: number;
	refresh: () => Promise<void>;
}

export const ReturnMeasuresContext = createContext<ReturnMeasuresState | undefined>(undefined);

export function useReturnMeasuresContext() {
	const ctx = useContext(ReturnMeasuresContext);
	if (!ctx) {
		throw new Error('useReturnMeasuresContext must be used inside <ReturnMeasuresProvider>');
	}
	return ctx;
}
