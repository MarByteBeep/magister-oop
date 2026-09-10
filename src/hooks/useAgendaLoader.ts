import { type Dispatch, type SetStateAction, useCallback, useRef } from 'react';
import { getAbsenceNoticesForDate, invalidateAbsenceNoticeCache } from '@/lib/absenceNoticeFetch';
import { noticesForStudent, uniqueNotices } from '@/lib/absenceNoticeUtils';
import { buildAgendaEntries, isAbsenceNoticeEntry } from '@/lib/agendaEntryUtils';
import { markDateRangeLoaded } from '@/lib/agendaLoadUtils';
import { eachDateKey, eachMonthKey, getDateKey } from '@/lib/dateUtils';
import { getReturnMeasuresForRange, invalidateReturnMeasureCache } from '@/lib/returnMeasureFetch';
import { scheduledReturnMeasuresForStudent } from '@/lib/returnMeasureUtils';
import { deepEqual, groupBy } from '@/lib/utils';
import { getJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { AbsenceNotice } from '@/magister/response/absence-notice.types';
import type { AgendaResponse } from '@/magister/response/agenda.types';
import type { Student } from '@/magister/types';
import type { LoadAgendaForStudentFn } from '@/types/students.types';

async function fetchAbsenceNoticesForStudent(
	studentUuid: string | undefined,
	dateKeys: string[],
	refreshCachedDates: boolean,
): Promise<AbsenceNotice[]> {
	if (!studentUuid) return [];
	if (refreshCachedDates) invalidateAbsenceNoticeCache(dateKeys);

	const noticesByDate = await Promise.all(dateKeys.map((dateKey) => getAbsenceNoticesForDate(dateKey)));
	return noticesForStudent(uniqueNotices(noticesByDate.flat()), studentUuid);
}

export function useAgendaLoader(setStudents: Dispatch<SetStateAction<Student[]>>, students: Student[]) {
	const studentsRef = useRef(students);
	studentsRef.current = students;

	return useCallback<LoadAgendaForStudentFn>(
		async (studentId: number, startDate: Date, endDate: Date) => {
			try {
				const startDateKey = getDateKey(startDate);
				const endDateKey = getDateKey(endDate);
				const dateKeys = eachDateKey(startDate, endDate);
				const student = studentsRef.current.find((item) => item.id === studentId);
				const refreshCachedDates = dateKeys.every(
					(dateKey) => student?.absenceNoticesLoadedFor?.[dateKey] === true,
				);
				// A repeat load is a manual sync, so the shared month cache must go back to the network too.
				if (refreshCachedDates) invalidateReturnMeasureCache(eachMonthKey(startDate, endDate));

				const [data, allReturnMeasures, absenceNotices] = await Promise.all([
					getJson<AgendaResponse>(
						endpoints.agenda(studentId, startDateKey, endDateKey),
						'include',
						'no-cache',
					),
					getReturnMeasuresForRange(startDate, endDate),
					fetchAbsenceNoticesForStudent(student?.externeId, dateKeys, refreshCachedDates),
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

				const entries = buildAgendaEntries(data.items, returnMeasures, absenceNotices, startDate, endDate);

				let agendaChanged = false;

				const receivedAgendaItems = data.items.length > 0;
				const receivedReturnMeasures = returnMeasures.length > 0;
				const receivedAbsenceNotices = entries.some(isAbsenceNoticeEntry);
				const canConfirmEmptyDays = !receivedAgendaItems && !receivedReturnMeasures && !receivedAbsenceNotices;

				setStudents((prev) => {
					const index = prev.findIndex((s) => s.id === studentId);
					if (index === -1) return prev;

					const student = prev[index];
					const dailyItems = groupBy(entries, (entry) => getDateKey(new Date(entry.start)));
					const dateRange = dateKeys;

					const updatedAgenda = { ...student.agenda };
					for (const [key, dayItems] of Object.entries(dailyItems)) {
						updatedAgenda[key] = dayItems;
					}
					for (const dateKey of dateRange) {
						if (dailyItems[dateKey] !== undefined) continue;
						if (canConfirmEmptyDays) {
							updatedAgenda[dateKey] = [];
						} else if (student.agenda?.[dateKey] !== undefined) {
							updatedAgenda[dateKey] = student.agenda[dateKey];
						}
					}

					const rangeFullyResolved = dateRange.every(
						(dateKey) =>
							dailyItems[dateKey] !== undefined ||
							canConfirmEmptyDays ||
							student.agenda?.[dateKey] !== undefined,
					);

					const absenceNoticesLoadedFor = rangeFullyResolved
						? markDateRangeLoaded(student.absenceNoticesLoadedFor, startDate, endDate)
						: student.absenceNoticesLoadedFor;

					const agendaUnchanged = deepEqual(student.agenda, updatedAgenda);
					const absenceNoticesFlagUnchanged = deepEqual(
						student.absenceNoticesLoadedFor,
						absenceNoticesLoadedFor,
					);
					if (agendaUnchanged && absenceNoticesFlagUnchanged) return prev;

					agendaChanged = !agendaUnchanged;

					const updatedStudent = {
						...student,
						agenda: updatedAgenda,
						absenceNoticesLoadedFor,
					};
					const newStudents = [...prev];
					newStudents[index] = updatedStudent;

					return newStudents;
				});
				return { entries, changed: agendaChanged };
			} catch (e) {
				console.error('Failed to fetch agenda for student', studentId, e);
				throw e;
			}
		},
		[setStudents],
	);
}
