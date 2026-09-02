import { addDays, getDateKey, getNow, toISOFromDateKeyAndTime } from '@/lib/dateUtils';
import type { AbsenceNotice, AbsenceNoticePerson } from '@/magister/response/absence-notice.types';

export type StoredAbsenceNoticeTemplate = {
	id: string;
	attendanceTypeCode: string;
	attendanceTypeDesc: string;
	startDayOffset: number;
	startTime: string;
	endDayOffset: number | null;
	endTime: string | null;
	creator: AbsenceNoticePerson;
};

export function expandAbsenceNoticeTemplates(templates: StoredAbsenceNoticeTemplate[]): AbsenceNotice[] {
	const today = getNow();

	return templates.map((template) => {
		const startDateKey = getDateKey(addDays(today, template.startDayOffset));
		const endDateKey = template.endDayOffset == null ? null : getDateKey(addDays(today, template.endDayOffset));

		return {
			id: template.id,
			attendanceTypeCode: template.attendanceTypeCode,
			attendanceTypeDesc: template.attendanceTypeDesc,
			startDateTime: toISOFromDateKeyAndTime(startDateKey, template.startTime),
			endDateTime: endDateKey && template.endTime ? toISOFromDateKeyAndTime(endDateKey, template.endTime) : null,
			creator: template.creator,
			modifiedBy: null,
			lastModified: null,
			recurrence: null,
			attachment: null,
			signals: [],
		};
	});
}
