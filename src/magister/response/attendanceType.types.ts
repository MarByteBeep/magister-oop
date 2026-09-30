export type AttendanceType = {
	code: string;
	description: string;
	commentMandatory: boolean;
	attachmentAllowed: boolean;
};

/** GET …/attendance-types?active=true — top-level JSON array. */
export type AttendanceTypesResponse = AttendanceType[];

export type CreateAbsenceNoticeRequest = {
	studentId: string;
	attendanceTypeCode: string;
	attendanceTypeDesc: string;
	startDateTime: string;
	endDateTime: string;
	comment: string;
	internalComment: string;
};

export type CreateAbsenceNoticeResponse = {
	isValid: boolean;
	validationMessages: string[] | null;
};
