import { type Dispatch, type SetStateAction, useCallback } from 'react';
import { getDateKey } from '@/lib/dateUtils';
import { groupBy } from '@/lib/utils';
import { getJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { AgendaResponse } from '@/magister/response/agenda.types';
import type { Student } from '@/magister/types';
import type { LoadAgendaForStudentFn } from '@/types/students.types';

const deepEqual = <T>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);

export function useAgendaLoader(setStudents: Dispatch<SetStateAction<Student[]>>) {
	return useCallback<LoadAgendaForStudentFn>(
		async (studentId: number, startDate: Date, endDate: Date) => {
			try {
				const startDateKey = getDateKey(startDate);
				const endDateKey = getDateKey(endDate);
				const url = endpoints.agenda(studentId, startDateKey, endDateKey);
				const data = await getJson<AgendaResponse>(url, 'include', 'no-cache');

				for (const item of data.items) {
					item.deelnames = item.deelnames.filter((e) => e.type === 'medewerker' || e.type === 'groep');

					for (const person of item.deelnames) {
						person.links = undefined;
					}
				}

				let agendaChanged = false;

				setStudents((prev) => {
					const index = prev.findIndex((s) => s.id === studentId);
					if (index === -1) return prev;

					const student = prev[index];
					const dailyItems = groupBy(data.items, (item) => getDateKey(new Date(item.begin)));

					const dateRange: string[] = [];
					const currentDate = new Date(startDate);
					while (currentDate <= endDate) {
						dateRange.push(getDateKey(currentDate));
						currentDate.setDate(currentDate.getDate() + 1);
					}

					const updatedAgenda = { ...student.agenda };
					for (const [key, items] of Object.entries(dailyItems)) {
						updatedAgenda[key] = items;
					}
					for (const dateKey of dateRange) {
						if (dailyItems[dateKey] === undefined) {
							updatedAgenda[dateKey] = [];
						}
					}

					if (deepEqual(student.agenda, updatedAgenda)) return prev;

					agendaChanged = true;

					const updatedStudent = { ...student, agenda: updatedAgenda };
					const newStudents = [...prev];
					newStudents[index] = updatedStudent;

					return newStudents;
				});
				return { items: data.items, changed: agendaChanged };
			} catch (e) {
				console.error('Failed to fetch agenda for student', studentId, e);
				throw e;
			}
		},
		[setStudents],
	);
}
