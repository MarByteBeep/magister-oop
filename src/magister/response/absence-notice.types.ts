export type AbsenceNoticePerson = {
	accountId: string;
	role: string;
	initials: string;
	lastName: string;
	infix: string;
};

export type AbsenceNotice = {
	id: string;
	attendanceTypeCode: string;
	attendanceTypeDesc: string;
	startDateTime: string;
	endDateTime: string | null;
	creator: AbsenceNoticePerson;
	modifiedBy: AbsenceNoticePerson | null;
	lastModified: string | null;
	recurrence: unknown | null;
	attachment: unknown | null;
	signals: unknown[];
};

export type AbsenceNoticesResponse = AbsenceNotice[];
