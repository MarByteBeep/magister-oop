import type { LessonInfo } from '@/lib/agendaUtils';
import type { AgendaEntry } from '@/magister/response/agenda-entry.types';
import type { Student } from '@/types/student.types';

export type LoadAgendaForStudentResult = {
	entries: AgendaEntry[];
	/** `true` when merged agenda state differs from what we had before this fetch. */
	changed: boolean;
};

export type LoadAgendaForStudentOptions = {
	/** Bypass caches and reset absence-notice load state for this range (manual sync). */
	refresh?: boolean;
};

export type LoadAgendaForStudentFn = (
	studentId: number,
	startDateKey: Date,
	endDateKey: Date,
	options?: LoadAgendaForStudentOptions,
) => Promise<LoadAgendaForStudentResult>;

export interface StudentsActions {
	loadAgendaForStudent: LoadAgendaForStudentFn;
	refresh: () => Promise<void>;
	setSelectedStudies: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export interface StudentsData {
	students: Student[];
	loading: boolean;
	studentsNeedingAgendaCount: number;
	error: string | null;
	selectedStudies: Set<string>;
	currentLessonInfo: LessonInfo;
	nextLessonInfo: LessonInfo;
}

export interface StudentsState extends StudentsData, StudentsActions {}
