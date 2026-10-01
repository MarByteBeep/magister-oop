import { applyAbsenceNoticesToStudents } from '@/lib/absence-notice/apply';
import { refreshAbsenceNoticesForDate } from '@/lib/absence-notice/fetch';
import { type BulkListSource, createBulkListRegistry, defineBulkList } from '@/lib/bulk-lists/registry';
import { applyRegistrationsToStudents } from '@/lib/registrations/apply';
import { refreshRegistrations } from '@/lib/registrations/fetch';
import { applyReturnMeasuresToStudents } from '@/lib/return-measure/apply';
import { refreshReturnMeasuresForDate } from '@/lib/return-measure/fetch';

export const absenceNoticeBulkList = defineBulkList({
	id: 'absence-notices',
	fetch: refreshAbsenceNoticesForDate,
	applyToStudents: applyAbsenceNoticesToStudents,
	publishSnapshot: false,
});

export const registrationsBulkList = defineBulkList({
	id: 'registrations',
	fetch: refreshRegistrations,
	applyToStudents: applyRegistrationsToStudents,
});

/** One call per month covers every student, so the agenda overlays and the tab share this list. */
export const returnMeasureBulkList = defineBulkList({
	id: 'return-measures',
	fetch: refreshReturnMeasuresForDate,
	applyToStudents: applyReturnMeasuresToStudents,
});

export const bulkListSources: BulkListSource[] = [absenceNoticeBulkList, registrationsBulkList, returnMeasureBulkList];

export const bulkListRegistry = createBulkListRegistry(bulkListSources);
