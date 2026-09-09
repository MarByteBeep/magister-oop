import { type Dispatch, type SetStateAction, useCallback, useRef } from 'react';
import { getAbsenceNoticesForDate, invalidateAbsenceNoticeCache } from '@/lib/absenceNoticeFetch';
import { noticesForStudent, uniqueNotices } from '@/lib/absenceNoticeUtils';
import { buildAgendaEntries, isAbsenceNoticeEntry } from '@/lib/agendaEntryUtils';
import { markDateRangeLoaded } from '@/lib/agendaLoadUtils';
import { eachDateKey, getDateKey } from '@/lib/dateUtils';
import { deepEqual, groupBy } from '@/lib/utils';
import { getJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { AbsenceNotice } from '@/magister/response/absence-notice.types';
import type { AgendaResponse } from '@/magister/response/agenda.types';
import type { ReturnMeasuresResponse } from '@/magister/response/return-measure.types';
import type { Student } from '@/magister/types';
import type { LoadAgendaForStudentFn } from '@/types/students.types';

const emptyReturnMeasuresResponse = (): ReturnMeasuresResponse => ({
	items: [],
	links: { first: { href: '' }, last: { href: '' } },
	totalCount: 0,
});

async function fetchReturnMeasures(studentId: number, startDateKey: string, endDateKey: string) {
	try {
		return await getJson<ReturnMeasuresResponse>(
			endpoints.returnMeasures(studentId, startDateKey, endDateKey),
			'include',
			'no-cache',
		);
	} catch (error) {
		console.warn('Failed to fetch return measures for student', studentId, error);
		return emptyReturnMeasuresResponse();
	}
}

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
				const [data, returnMeasuresData, absenceNotices] = await Promise.all([
					getJson<AgendaResponse>(
						endpoints.agenda(studentId, startDateKey, endDateKey),
						'include',
						'no-cache',
					),
					fetchReturnMeasures(studentId, startDateKey, endDateKey),
					fetchAbsenceNoticesForStudent(student?.externeId, dateKeys, refreshCachedDates),
				]);

				for (const item of data.items) {
					item.deelnames = item.deelnames.filter((e) => e.type === 'medewerker' || e.type === 'groep');

					for (const person of item.deelnames) {
						person.links = undefined;
					}
				}

				const entries = buildAgendaEntries(
					data.items,
					returnMeasuresData.items,
					absenceNotices,
					startDate,
					endDate,
				);

				let agendaChanged = false;

				const receivedAgendaItems = data.items.length > 0;
				const receivedReturnMeasures = returnMeasuresData.items.length > 0;
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

					const returnMeasuresLoadedFor = rangeFullyResolved
						? markDateRangeLoaded(student.returnMeasuresLoadedFor, startDate, endDate)
						: student.returnMeasuresLoadedFor;
					const absenceNoticesLoadedFor = rangeFullyResolved
						? markDateRangeLoaded(student.absenceNoticesLoadedFor, startDate, endDate)
						: student.absenceNoticesLoadedFor;

					const agendaUnchanged = deepEqual(student.agenda, updatedAgenda);
					const returnMeasuresFlagUnchanged = deepEqual(
						student.returnMeasuresLoadedFor,
						returnMeasuresLoadedFor,
					);
					const absenceNoticesFlagUnchanged = deepEqual(
						student.absenceNoticesLoadedFor,
						absenceNoticesLoadedFor,
					);
					if (agendaUnchanged && returnMeasuresFlagUnchanged && absenceNoticesFlagUnchanged) return prev;

					agendaChanged = !agendaUnchanged;

					const updatedStudent = {
						...student,
						agenda: updatedAgenda,
						returnMeasuresLoadedFor,
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
