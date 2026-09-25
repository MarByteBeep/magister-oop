import { invokeLoadAgendaForStudent } from '@/lib/loadAgendaForStudentRegistry';
import type { LoadAgendaForStudentFn } from '@/types/students.types';

export function useLoadAgendaForStudent(): LoadAgendaForStudentFn {
	return invokeLoadAgendaForStudent;
}
