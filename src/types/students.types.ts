import type { LessonInfo } from '@/lib/agendaUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { Student } from '@/magister/types';

export type LoadAgendaForStudentResult = {
	items: AgendaItem[];
	/** `true` when merged agenda state differs from what we had before this fetch. */
	changed: boolean;
};

export type LoadAgendaForStudentFn = (
	studentId: number,
	startDateKey: Date,
	endDateKey: Date,
) => Promise<LoadAgendaForStudentResult>;

export interface StudentsState {
	students: Student[];
	loading: boolean;
	studentsNeedingAgendaCount: number;
	error: string | null;
	refresh: () => Promise<void>;

	selectedStudies: Set<string>;
	setSelectedStudies: React.Dispatch<React.SetStateAction<Set<string>>>;

	loadAgendaForStudent: LoadAgendaForStudentFn;

	currentLessonInfo: LessonInfo;
	nextLessonInfo: LessonInfo;
}
