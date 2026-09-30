import { getAttendanceType } from '@/lib/absence-notice/attendanceTypes';
import { buildAgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { toISOFromDateKeyAndTime } from '@/lib/shared/dateUtils';
import type { CreateAbsenceNoticeRequest } from '@/magister/response/attendanceType.types';

export type CreateAbsenceNoticeFormInput = {
	studentUuid: string;
	dateKey: string;
	startTime: string;
	endTime: string;
	attendanceTypeCode: string;
	comment: string;
	internalComment: string;
};

export function buildCreateAbsenceNoticeRequest(
	input: CreateAbsenceNoticeFormInput,
): CreateAbsenceNoticeRequest | null {
	const selection = buildAgendaSlotSelection(input.dateKey, input.startTime, input.endTime);
	const attendanceType = getAttendanceType(input.attendanceTypeCode);
	if (!selection || !attendanceType || input.studentUuid.trim().length === 0) return null;

	const comment = input.comment.trim();
	if (attendanceType.commentMandatory && comment.length === 0) return null;

	return {
		studentId: input.studentUuid,
		attendanceTypeCode: attendanceType.code,
		attendanceTypeDesc: attendanceType.description,
		startDateTime: toISOFromDateKeyAndTime(input.dateKey, input.startTime),
		endDateTime: toISOFromDateKeyAndTime(input.dateKey, input.endTime),
		comment,
		internalComment: input.internalComment.trim(),
	};
}
