import type { AgendaItem } from '@/magister/response/agenda.types';
import type { Student as StudentInternal } from '@/magister/response/student.types';

export type UUID = string;
export type Links = Record<string, unknown> | undefined;

export type Student = {
	lockerCode?: string;
	agenda?: Record<string, AgendaItem[]>;
	currentAgendaItem?: AgendaItem | null;
	nextAgendaItem?: AgendaItem | null;
} & StudentInternal;
