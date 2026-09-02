import type { AgendaItem } from '@/magister/response/agenda.types';
import type { StudentBase } from '@/magister/response/student.types';

export type Links = Record<string, unknown> | undefined;

export type Student = {
	lockerCode?: string;
	agenda?: Record<string, AgendaItem[]>;
	returnMeasuresLoadedFor?: Record<string, boolean>;
	currentAgendaItem?: AgendaItem | null;
	nextAgendaItem?: AgendaItem | null;
} & StudentBase;
