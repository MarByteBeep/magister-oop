import type { LoadAgendaForStudentFn } from '@/types/students.types';

let loadAgendaForStudentImpl: LoadAgendaForStudentFn = async () => {
	throw new Error('loadAgendaForStudent is not registered');
};

export function registerLoadAgendaForStudent(fn: LoadAgendaForStudentFn): void {
	loadAgendaForStudentImpl = fn;
}

export const invokeLoadAgendaForStudent: LoadAgendaForStudentFn = (...args) => loadAgendaForStudentImpl(...args);
