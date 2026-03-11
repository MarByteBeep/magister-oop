import { createContext, useContext } from 'react';
import type { UnauthorizedAbsencesResponse } from '@/magister/response/unauthorized-absence.types';

export interface AbsencesState {
	data: UnauthorizedAbsencesResponse | null;
	loading: boolean;
	refreshing: boolean;
	error: string | null;
	absentCount: number;
	refresh: () => void;
}

export const AbsencesContext = createContext<AbsencesState | undefined>(undefined);

export function useAbsencesContext() {
	const ctx = useContext(AbsencesContext);
	if (!ctx) {
		throw new Error('useAbsencesContext must be used inside <AbsencesProvider>');
	}
	return ctx;
}
