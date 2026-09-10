import { createContext, useContext } from 'react';

/** Switch the open student dialog to the weekly agenda on this date. */
export const StudentAgendaFocusContext = createContext<((date: Date) => void) | null>(null);

export function useStudentAgendaFocus() {
	return useContext(StudentAgendaFocusContext);
}
