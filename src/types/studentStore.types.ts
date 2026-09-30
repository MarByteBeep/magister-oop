import type { AbsenceNoticeLoadDayState } from '@/lib/absence-notice/loadState';
import type { Student } from '@/types/student.types';

/** Store update payload — may carry cache fields that are not returned on read. */
export type StudentWrite = Student & {
	absenceNoticeLoad?: Record<string, AbsenceNoticeLoadDayState>;
};
