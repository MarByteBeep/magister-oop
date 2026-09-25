import { createContext, useContext } from 'react';
import type { StudentsActions, StudentsData, StudentsState } from '@/types/students.types';

export const StudentsDataContext = createContext<StudentsData | undefined>(undefined);
export const StudentsActionsContext = createContext<StudentsActions | undefined>(undefined);

export function useStudentsData(): StudentsData {
	const ctx = useContext(StudentsDataContext);
	if (!ctx) {
		throw new Error('useStudentsData must be used inside <StudentsProvider>');
	}
	return ctx;
}

export function useStudentsActions(): StudentsActions {
	const ctx = useContext(StudentsActionsContext);
	if (!ctx) {
		throw new Error('useStudentsActions must be used inside <StudentsProvider>');
	}
	return ctx;
}

/** Prefer `useStudentsData` / `useStudentsActions` when you only need one side. */
export function useStudentsContext(): StudentsState {
	return { ...useStudentsData(), ...useStudentsActions() };
}
