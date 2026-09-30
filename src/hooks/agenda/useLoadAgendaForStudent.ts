import { invokeLoadAgendaForStudent } from '@/lib/agenda/loadForStudentRegistry';
import type { LoadAgendaForStudentFn } from '@/types/students.types';

export function useLoadAgendaForStudent(): LoadAgendaForStudentFn {
	return invokeLoadAgendaForStudent;
}
