import type { LessonInfo } from '@/lib/agendaUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { Student } from '@/magister/types';

export type LoadAgendaForStudentFn = (studentId: number, startDateKey: Date, endDateKey: Date) => Promise<AgendaItem[]>;

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
