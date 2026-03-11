// src/contexts/StudentsContext.tsx
import { createContext, useContext } from 'react';
import type { StudentsState } from '@/types/students.types';

export const StudentsContext = createContext<StudentsState | undefined>(undefined);

export function useStudentsContext() {
	const ctx = useContext(StudentsContext);
	if (!ctx) {
		throw new Error('useStudentsContext must be used inside <StudentsProvider>');
	}
	return ctx;
}
