import { applyAbsenceNoticesToStudents } from '@/lib/absenceNoticeApply';
import { refreshAbsenceNoticesForDate } from '@/lib/absenceNoticeFetch';
import { type BulkListSource, createBulkListRegistry, defineBulkList } from '@/lib/bulkListRegistry';
import { refreshRegistrations } from '@/lib/registrationsFetch';

export const absenceNoticeBulkList = defineBulkList({
	id: 'absence-notices',
	fetch: refreshAbsenceNoticesForDate,
	applyToStudents: applyAbsenceNoticesToStudents,
	publishSnapshot: false,
});

export const registrationsBulkList = defineBulkList({
	id: 'registrations',
	fetch: refreshRegistrations,
});

export const bulkListSources: BulkListSource[] = [absenceNoticeBulkList, registrationsBulkList];

export const bulkListRegistry = createBulkListRegistry(bulkListSources);
