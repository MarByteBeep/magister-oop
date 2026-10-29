import { faker } from '@faker-js/faker';
import type { AbsenceNoticePerson } from '@/magister/response/absenceNotice.types';
import type { StudentBase } from '@/magister/response/student.types';
import type { StoredAbsenceNoticeTemplate } from '../api/utils/absenceNotices';

const TEST_ABSENCE_NOTICES = [
	{
		attendanceTypeCode: 'ZK',
		attendanceTypeDescription: 'Ziek gemeld',
		startDayOffset: -1,
		startTime: '00:00',
		endDayOffset: null,
		endTime: null,
		expectedEndDayOffset: 2,
		expectedEndTime: '16:00',
		comment: '',
		creatorRole: 'Parent',
	},
	{
		attendanceTypeCode: 'D',
		attendanceTypeDescription: 'Dokter, Huisarts',
		startDayOffset: 0,
		startTime: '08:30',
		endDayOffset: 0,
		endTime: '10:30',
		expectedEndDayOffset: null,
		expectedEndTime: null,
		comment: '',
		creatorRole: 'Parent',
	},
	{
		attendanceTypeCode: 'SL',
		attendanceTypeDescription: 'Schoolleiding',
		startDayOffset: 0,
		startTime: '10:50',
		endDayOffset: 0,
		endTime: '12:10',
		expectedEndDayOffset: null,
		expectedEndTime: null,
		comment: 'Gesprek schoolleiding',
		creatorRole: 'SupportingStaff',
	},
] as const;

function createCreator(studentId: number, role: string): AbsenceNoticePerson {
	faker.seed(studentId + 42);
	return {
		accountId: faker.string.uuid(),
		role,
		initials: faker.string.alpha({ casing: 'upper', length: 2 }),
		lastName: faker.person.lastName(),
		infix: '',
	};
}

function createTemplate(studentId: number, noticeIndex: number): StoredAbsenceNoticeTemplate {
	const notice = TEST_ABSENCE_NOTICES[noticeIndex % TEST_ABSENCE_NOTICES.length];
	faker.seed(studentId + noticeIndex * 1000 + 7);

	return {
		absenceNoticeId: faker.string.uuid(),
		attendanceTypeCode: notice.attendanceTypeCode,
		attendanceTypeDescription: notice.attendanceTypeDescription,
		startDayOffset: notice.startDayOffset,
		startTime: notice.startTime,
		endDayOffset: notice.endDayOffset,
		endTime: notice.endTime,
		expectedEndDayOffset: notice.expectedEndDayOffset,
		expectedEndTime: notice.expectedEndTime,
		comment: notice.comment,
		internalComment: '',
		creator: createCreator(studentId, notice.creatorRole),
		isRecurring: false,
	};
}

const ZK_NOTICE_INDEX = 0;
const OTHER_NOTICE_COUNT = TEST_ABSENCE_NOTICES.length - 1;

function assignZkNotice(result: Record<string, StoredAbsenceNoticeTemplate[]>, student: StudentBase): void {
	result[student.externeId] = [createTemplate(student.id, ZK_NOTICE_INDEX)];
}

function assignOtherNotice(
	result: Record<string, StoredAbsenceNoticeTemplate[]>,
	student: StudentBase,
	otherNoticeCounter: number,
): number {
	const noticeIndex = (otherNoticeCounter % OTHER_NOTICE_COUNT) + 1;
	result[student.externeId] = [createTemplate(student.id, noticeIndex)];
	return otherNoticeCounter + 1;
}

function processAbsenceStudent(
	index: number,
	student: StudentBase,
	result: Record<string, StoredAbsenceNoticeTemplate[]>,
	otherNoticeCounter: number,
): number {
	if (index % 10 === 0) {
		assignZkNotice(result, student);
		return otherNoticeCounter;
	}
	if (index % 5 !== 0) return otherNoticeCounter;
	return assignOtherNotice(result, student, otherNoticeCounter);
}

export function generateAbsenceNoticeData(allStudents: StudentBase[]): Record<string, StoredAbsenceNoticeTemplate[]> {
	const result: Record<string, StoredAbsenceNoticeTemplate[]> = {};
	let otherNoticeCounter = 0;

	for (const [index, student] of allStudents.entries()) {
		otherNoticeCounter = processAbsenceStudent(index, student, result, otherNoticeCounter);
	}

	return result;
}
