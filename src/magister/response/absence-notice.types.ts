export type AbsenceNoticePerson = {
	accountId: string;
	role: string;
	initials: string;
	lastName: string;
	infix: string;
};

export type AbsenceNoticeStudent = {
	id: string;
	firstName: string;
	lastName: string;
	infix: string;
	groups: string[];
	studies: string[];
	zenId: number;
	studentNumber: number;
	hasPhoto: boolean;
};

export type AbsenceNoticeUnit = {
	id: string;
	name: string;
};

export type AbsenceNoticeLink = {
	href: string;
	rel: string;
	method: string;
};

export type AbsenceNotice = {
	absenceNoticeId: string;
	attendanceTypeCode: string;
	attendanceTypeDescription: string;
	startDateTime: string;
	endDateTime: string | null;
	expectedEndDateTime: string | null;
	createdDateTime: string;
	consecutiveDays: number;
	student: AbsenceNoticeStudent;
	unit: AbsenceNoticeUnit;
	comment: string;
	internalComment: string;
	creator: AbsenceNoticePerson;
	modifiedBy: AbsenceNoticePerson | null;
	lastModified: string | null;
	signals: unknown[];
	attachment: unknown | null;
	links: AbsenceNoticeLink[];
	isRecurring: boolean;
};

export type AbsenceNoticesResponse = {
	overviewDate: string;
	count: number;
	top: number;
	skip: number;
	items: AbsenceNotice[];
};
