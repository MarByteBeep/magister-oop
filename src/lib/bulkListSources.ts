import { applyAbsenceNoticesToStudents } from '@/lib/absenceNoticeApply';
import { refreshAbsenceNoticesForDate } from '@/lib/absenceNoticeFetch';
import { type BulkListSource, createBulkListRegistry, defineBulkList } from '@/lib/bulkListRegistry';
import { refreshRegistrations } from '@/lib/registrationsFetch';
import { applyReturnMeasuresToStudents } from '@/lib/returnMeasureApply';
import { refreshReturnMeasuresForDate } from '@/lib/returnMeasureFetch';

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

/** One call per month covers every student, so the agenda overlays and the tab share this list. */
export const returnMeasureBulkList = defineBulkList({
	id: 'return-measures',
	fetch: refreshReturnMeasuresForDate,
	applyToStudents: applyReturnMeasuresToStudents,
});

export const bulkListSources: BulkListSource[] = [absenceNoticeBulkList, registrationsBulkList, returnMeasureBulkList];

export const bulkListRegistry = createBulkListRegistry(bulkListSources);
