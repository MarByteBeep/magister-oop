import type { AbsenceNoticePerson } from '@/magister/response/absenceNotice.types';

export type StoredAbsenceNoticeTemplate = {
	absenceNoticeId: string;
	attendanceTypeCode: string;
	attendanceTypeDescription: string;
	startDayOffset: number;
	startTime: string;
	endDayOffset: number | null;
	endTime: string | null;
	expectedEndDayOffset: number | null;
	expectedEndTime: string | null;
	comment: string;
	internalComment: string;
	creator: AbsenceNoticePerson;
	isRecurring: boolean;
};
