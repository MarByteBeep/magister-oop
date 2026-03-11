// src/contexts/StudentsProvider.tsx

import type { ReactNode } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { StudentsContext } from './StudentsContext';

interface Props {
	children: ReactNode;
}

export function StudentsProvider({ children }: Props) {
	const state = useStudents();

	return <StudentsContext.Provider value={state}>{children}</StudentsContext.Provider>;
}
