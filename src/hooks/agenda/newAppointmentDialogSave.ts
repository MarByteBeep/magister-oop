import type { CreateMode } from '@/hooks/agenda/useNewAppointmentDialogState';
import { getAttendanceType } from '@/lib/absence-notice/attendanceTypes';
import { submitAbsenceNotice } from '@/lib/absence-notice/create';
import { buildAgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { submitReturnMeasure } from '@/lib/return-measure/create';

function canSaveReturnMeasure(description: string, dayCount: string): boolean {
	const parsedDayCount = Number.parseInt(dayCount, 10);
	if (description.trim().length === 0) return false;
	if (!Number.isFinite(parsedDayCount)) return false;
	return parsedDayCount >= 1;
}

function attendanceCommentOk(commentMandatory: boolean, comment: string): boolean {
	if (!commentMandatory) return true;
	return comment.trim().length > 0;
}

function canSaveAbsenceNotice(studentExterneId: string, attendanceTypeCode: string, comment: string): boolean {
	if (studentExterneId.trim().length === 0) return false;
	const selectedAttendanceType = getAttendanceType(attendanceTypeCode);
	if (!selectedAttendanceType) return false;
	return attendanceCommentOk(selectedAttendanceType.commentMandatory, comment);
}

export function canSaveNewAppointment(input: {
	mode: CreateMode;
	studentExterneId: string;
	dateKey: string;
	startTime: string;
	endTime: string;
	description: string;
	dayCount: string;
	attendanceTypeCode: string;
	comment: string;
}): boolean {
	const slotSelection = buildAgendaSlotSelection(input.dateKey, input.startTime, input.endTime);
	if (!slotSelection) return false;
	if (input.mode === 'return-measure') {
		return canSaveReturnMeasure(input.description, input.dayCount);
	}
	return canSaveAbsenceNotice(input.studentExterneId, input.attendanceTypeCode, input.comment);
}

export async function saveNewAppointment(input: {
	mode: CreateMode;
	studentId: number;
	studentExterneId: string;
	dateKey: string;
	startTime: string;
	endTime: string;
	description: string;
	dayCount: string;
	attendanceTypeCode: string;
	comment: string;
	internalComment: string;
}): Promise<boolean> {
	if (input.mode === 'absence') {
		return submitAbsenceNotice({
			studentUuid: input.studentExterneId,
			dateKey: input.dateKey,
			startTime: input.startTime,
			endTime: input.endTime,
			attendanceTypeCode: input.attendanceTypeCode,
			comment: input.comment,
			internalComment: input.internalComment,
		});
	}

	const parsedDayCount = Number.parseInt(input.dayCount, 10);
	return submitReturnMeasure(input.studentId, {
		dateKey: input.dateKey,
		startTime: input.startTime,
		endTime: input.endTime,
		description: input.description,
		dayCount: parsedDayCount,
	});
}
