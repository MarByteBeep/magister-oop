import { faker } from '@faker-js/faker';
import type { AbsenceNoticePerson } from '@/magister/response/absence-notice.types';
import type { StudentBase } from '@/magister/response/student.types';
import type { StoredAbsenceNoticeTemplate } from '../api/utils/absenceNotices';

const TEST_ABSENCE_NOTICES = [
	{
		attendanceTypeCode: 'ZK',
		attendanceTypeDesc: 'Ziek gemeld',
		startDayOffset: -1,
		startTime: '00:00',
		endDayOffset: null,
		endTime: null,
	},
	{
		attendanceTypeCode: 'D',
		attendanceTypeDesc: 'Dokter, Huisarts',
		startDayOffset: 0,
		startTime: '08:30',
		endDayOffset: 0,
		endTime: '10:30',
	},
	{
		attendanceTypeCode: 'SL',
		attendanceTypeDesc: 'Schoolleiding',
		startDayOffset: 0,
		startTime: '10:50',
		endDayOffset: 0,
		endTime: '12:10',
	},
] as const;

function createCreator(studentId: number): AbsenceNoticePerson {
	faker.seed(studentId + 42);
	return {
		accountId: faker.string.uuid(),
		role: 'Parent',
		initials: faker.string.alpha({ casing: 'upper', length: 2 }),
		lastName: faker.person.lastName(),
		infix: '',
	};
}

function createTemplate(studentId: number, noticeIndex: number): StoredAbsenceNoticeTemplate {
	const notice = TEST_ABSENCE_NOTICES[noticeIndex % TEST_ABSENCE_NOTICES.length];
	faker.seed(studentId + noticeIndex * 1000 + 7);

	return {
		id: faker.string.uuid(),
		attendanceTypeCode: notice.attendanceTypeCode,
		attendanceTypeDesc: notice.attendanceTypeDesc,
		startDayOffset: notice.startDayOffset,
		startTime: notice.startTime,
		endDayOffset: notice.endDayOffset,
		endTime: notice.endTime,
		creator: createCreator(studentId),
	};
}

export function generateAbsenceNoticeData(allStudents: StudentBase[]): Record<string, StoredAbsenceNoticeTemplate[]> {
	const result: Record<string, StoredAbsenceNoticeTemplate[]> = {};
	let noticeCounter = 0;

	for (const [index, student] of allStudents.entries()) {
		if (index % 5 !== 0) continue;

		const noticeIndex = noticeCounter % TEST_ABSENCE_NOTICES.length;
		result[student.externeId] = [createTemplate(student.id, noticeIndex)];
		noticeCounter++;
	}

	return result;
}
