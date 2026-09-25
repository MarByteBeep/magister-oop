import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import type { StudentBase } from '@/magister/response/student.types';

/** App student: API fields plus locker and hydrated agenda days. */
export type Student = StudentBase & {
	lockerCode?: string;
	agenda?: Record<string, AgendaEntry[]>;
};
