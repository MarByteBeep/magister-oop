import type { CreateMode } from '@/hooks/agenda/useNewAppointmentDialogState';
import { getAttendanceType } from '@/lib/absence-notice/attendanceTypes';
import { submitAbsenceNotice } from '@/lib/absence-notice/create';
import { buildAgendaSlotSelection } from '@/lib/agenda/slotSelection';
import { submitReturnMeasure } from '@/lib/return-measure/create';
import { isReturnMeasureDateInPast } from '@/lib/return-measure/scheduleBounds';

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
		if (isReturnMeasureDateInPast(input.dateKey)) return false;
		const parsedDayCount = Number.parseInt(input.dayCount, 10);
		return input.description.trim().length > 0 && Number.isFinite(parsedDayCount) && parsedDayCount >= 1;
	}

	const selectedAttendanceType = getAttendanceType(input.attendanceTypeCode);
	return (
		input.studentExterneId.trim().length > 0 &&
		selectedAttendanceType != null &&
		(!selectedAttendanceType.commentMandatory || input.comment.trim().length > 0)
	);
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
