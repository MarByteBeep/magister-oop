import { type Dispatch, type SetStateAction, useCallback, useRef } from 'react';
import { getAbsenceNoticesForDate, invalidateAbsenceNoticeCache } from '@/lib/absence-notice/fetch';
import { applyFetchResult, resetDays } from '@/lib/absence-notice/loadState';
import { noticesForStudent, uniqueNotices } from '@/lib/absence-notice/utils';
import { buildAgendaEntries } from '@/lib/agenda/entryUtils';
import { mergeFetchedAgendaForRange } from '@/lib/agenda/loadUtils';
import { loadRegistrationEntriesForStudent } from '@/lib/registrations/load';
import { getReturnMeasuresForRange, invalidateReturnMeasureCache } from '@/lib/return-measure/fetch';
import { scheduledReturnMeasuresForStudent } from '@/lib/return-measure/utils';
import { eachDateKey, eachMonthKey, getDateKey } from '@/lib/shared/dateUtils';
import { studentDataStore } from '@/lib/students/dataStore';
import { deepEqual, groupBy } from '@/lib/utils';
import { getJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { AbsenceNotice } from '@/magister/response/absenceNotice.types';
import type { AgendaResponse } from '@/magister/response/agenda.types';
import type { Student } from '@/types/student.types';
import type { StudentWrite } from '@/types/studentStore.types';
import type { LoadAgendaForStudentFn } from '@/types/students.types';

const inflightAgendaLoads = new Map<string, ReturnType<LoadAgendaForStudentFn>>();

function agendaLoadKey(studentId: number, startDateKey: string, endDateKey: string, refresh: boolean): string {
	const base = `${studentId}:${startDateKey}:${endDateKey}`;
	return refresh ? `${base}:refresh` : base;
}

async function fetchAbsenceNoticesForStudent(
	studentUuid: string | undefined,
	dateKeys: string[],
	refreshCachedDates: boolean,
): Promise<{ notices: AbsenceNotice[]; loadedDateKeys: string[]; failedDateKeys: string[] }> {
	if (!studentUuid) {
		return { notices: [], loadedDateKeys: dateKeys, failedDateKeys: [] };
	}
	if (refreshCachedDates) invalidateAbsenceNoticeCache(dateKeys);

	const results = await Promise.allSettled(dateKeys.map((dateKey) => getAbsenceNoticesForDate(dateKey)));
	const noticesByDate: AbsenceNotice[][] = [];
	const loadedDateKeys: string[] = [];
	const failedDateKeys: string[] = [];

	for (let index = 0; index < results.length; index++) {
		const result = results[index];
		if (result.status === 'fulfilled') {
			noticesByDate.push(result.value);
			loadedDateKeys.push(dateKeys[index]);
			continue;
		}
		failedDateKeys.push(dateKeys[index]);
	}

	return {
		notices: noticesForStudent(uniqueNotices(noticesByDate.flat()), studentUuid),
		loadedDateKeys,
		failedDateKeys,
	};
}

export function useAgendaLoader(setStudents: Dispatch<SetStateAction<StudentWrite[]>>, students: Student[]) {
	const studentsRef = useRef(students);
	studentsRef.current = students;

	return useCallback<LoadAgendaForStudentFn>(
		(studentId, startDate, endDate, options) => {
			const startDateKey = getDateKey(startDate);
			const endDateKey = getDateKey(endDate);
			const refresh = options?.refresh === true;
			const key = agendaLoadKey(studentId, startDateKey, endDateKey, refresh);
			const pending = inflightAgendaLoads.get(key);
			if (pending) return pending;

			let loadPromise!: ReturnType<LoadAgendaForStudentFn>;
			loadPromise = (async () => {
				try {
					const dateKeys = eachDateKey(startDate, endDate);
					const student = studentsRef.current.find((item) => item.id === studentId);
					if (refresh) invalidateReturnMeasureCache(eachMonthKey(startDate, endDate));

					const [data, allReturnMeasures, absenceNoticeResult, registrationEntries] = await Promise.all([
						getJson<AgendaResponse>(
							endpoints.agenda(studentId, startDateKey, endDateKey),
							'include',
							'no-cache',
						),
						getReturnMeasuresForRange(startDate, endDate),
						fetchAbsenceNoticesForStudent(student?.externeId, dateKeys, refresh),
						loadRegistrationEntriesForStudent(studentId, dateKeys, student?.agenda, refresh),
					]);
					const returnMeasures = scheduledReturnMeasuresForStudent(
						allReturnMeasures,
						studentId,
						startDate,
						endDate,
					);

					for (const item of data.items) {
						item.deelnames = item.deelnames.filter((e) => e.type === 'medewerker' || e.type === 'groep');

						for (const person of item.deelnames) {
							person.links = undefined;
						}
					}

					const entries = buildAgendaEntries(
						data.items,
						returnMeasures,
						absenceNoticeResult.notices,
						registrationEntries,
						startDate,
						endDate,
					);

					let agendaChanged = false;

					const dailyItems = groupBy(entries, (entry) => getDateKey(new Date(entry.start)));

					setStudents((prev) => {
						const index = prev.findIndex((s) => s.id === studentId);
						if (index === -1) return prev;

						const currentStudent = prev[index];
						const currentAgenda = currentStudent.agenda;
						const updatedAgenda = mergeFetchedAgendaForRange(currentAgenda, dailyItems, dateKeys);
						const currentLoad = studentDataStore.getAbsenceNoticeLoad(studentId);
						let absenceNoticeLoad = refresh ? resetDays(currentLoad, dateKeys) : currentLoad;
						absenceNoticeLoad = applyFetchResult(
							absenceNoticeLoad,
							absenceNoticeResult.loadedDateKeys,
							absenceNoticeResult.failedDateKeys,
						);

						const agendaUnchanged = deepEqual(currentAgenda, updatedAgenda);
						const loadUnchanged = deepEqual(currentLoad, absenceNoticeLoad);
						if (agendaUnchanged && loadUnchanged) return prev;

						agendaChanged = !agendaUnchanged;

						const updatedStudent = {
							...currentStudent,
							agenda: updatedAgenda,
							absenceNoticeLoad,
						};
						const newStudents = [...prev];
						newStudents[index] = updatedStudent;

						return newStudents;
					});
					return { entries, changed: agendaChanged };
				} catch (e) {
					console.error('Failed to fetch agenda for student', studentId, e);
					throw e;
				} finally {
					if (inflightAgendaLoads.get(key) === loadPromise) {
						inflightAgendaLoads.delete(key);
					}
				}
			})();
			inflightAgendaLoads.set(key, loadPromise);
			return loadPromise;
		},
		[setStudents],
	);
}
