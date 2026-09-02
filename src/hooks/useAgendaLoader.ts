import { type Dispatch, type SetStateAction, useCallback } from 'react';
import { markReturnMeasuresLoadedForRange } from '@/lib/agendaLoadUtils';
import { getDateKey } from '@/lib/dateUtils';
import { mergeAgendaWithReturnMeasures } from '@/lib/returnMeasureUtils';
import { deepEqual, groupBy } from '@/lib/utils';
import { getJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
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

export function useAgendaLoader(setStudents: Dispatch<SetStateAction<Student[]>>) {
	return useCallback<LoadAgendaForStudentFn>(
		async (studentId: number, startDate: Date, endDate: Date) => {
			try {
				const startDateKey = getDateKey(startDate);
				const endDateKey = getDateKey(endDate);
				const [data, returnMeasuresData] = await Promise.all([
					getJson<AgendaResponse>(
						endpoints.agenda(studentId, startDateKey, endDateKey),
						'include',
						'no-cache',
					),
					fetchReturnMeasures(studentId, startDateKey, endDateKey),
				]);

				for (const item of data.items) {
					item.deelnames = item.deelnames.filter((e) => e.type === 'medewerker' || e.type === 'groep');

					for (const person of item.deelnames) {
						person.links = undefined;
					}
				}

				const items = mergeAgendaWithReturnMeasures(data.items, returnMeasuresData.items);

				let agendaChanged = false;

				const receivedAgendaItems = data.items.length > 0;
				const receivedReturnMeasures = returnMeasuresData.items.length > 0;
				const canConfirmEmptyDays = !receivedAgendaItems && !receivedReturnMeasures;

				setStudents((prev) => {
					const index = prev.findIndex((s) => s.id === studentId);
					if (index === -1) return prev;

					const student = prev[index];
					const dailyItems = groupBy(items, (item) => getDateKey(new Date(item.begin)));

					const dateRange: string[] = [];
					const currentDate = new Date(startDate);
					while (currentDate <= endDate) {
						dateRange.push(getDateKey(currentDate));
						currentDate.setDate(currentDate.getDate() + 1);
					}

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
						? markReturnMeasuresLoadedForRange(student.returnMeasuresLoadedFor, startDate, endDate)
						: student.returnMeasuresLoadedFor;

					const agendaUnchanged = deepEqual(student.agenda, updatedAgenda);
					const returnMeasuresFlagUnchanged = deepEqual(
						student.returnMeasuresLoadedFor,
						returnMeasuresLoadedFor,
					);
					if (agendaUnchanged && returnMeasuresFlagUnchanged) return prev;

					agendaChanged = !agendaUnchanged;

					const updatedStudent = {
						...student,
						agenda: updatedAgenda,
						returnMeasuresLoadedFor,
					};
					const newStudents = [...prev];
					newStudents[index] = updatedStudent;

					return newStudents;
				});
				return { items, changed: agendaChanged };
			} catch (e) {
				console.error('Failed to fetch agenda for student', studentId, e);
				throw e;
			}
		},
		[setStudents],
	);
}
