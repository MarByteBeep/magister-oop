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
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';
import { isMagisterUnavailableError } from '@/magister/sessionErrors';
import type { Student } from '@/types/student.types';
import type { StudentWrite } from '@/types/studentStore.types';
import type { LoadAgendaForStudentFn } from '@/types/students.types';

const inflightAgendaLoads = new Map<string, ReturnType<LoadAgendaForStudentFn>>();

function agendaLoadKey(studentId: number, startDateKey: string, endDateKey: string, refresh: boolean): string {
	const base = `${studentId}:${startDateKey}:${endDateKey}`;
	return refresh ? `${base}:refresh` : base;
}

function collectAbsenceNoticeResults(
	dateKeys: string[],
	results: PromiseSettledResult<AbsenceNotice[]>[],
): {
	noticesByDate: AbsenceNotice[][];
	loadedDateKeys: string[];
	failedDateKeys: string[];
} {
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

	return { noticesByDate, loadedDateKeys, failedDateKeys };
}

async function fetchAbsenceNoticesForStudent(
	studentUuid: string | undefined,
	dateKeys: string[],
	refreshCachedDates: boolean,
): Promise<{
	notices: AbsenceNotice[];
	loadedDateKeys: string[];
	failedDateKeys: string[];
}> {
	if (!studentUuid) {
		return { notices: [], loadedDateKeys: dateKeys, failedDateKeys: [] };
	}
	if (refreshCachedDates) invalidateAbsenceNoticeCache(dateKeys);

	const results = await Promise.allSettled(dateKeys.map((dateKey) => getAbsenceNoticesForDate(dateKey)));
	const { noticesByDate, loadedDateKeys, failedDateKeys } = collectAbsenceNoticeResults(dateKeys, results);

	return {
		notices: noticesForStudent(uniqueNotices(noticesByDate.flat()), studentUuid),
		loadedDateKeys,
		failedDateKeys,
	};
}

function sanitizeAgendaItemDeelnames(items: AgendaResponse['items']): void {
	for (const item of items) {
		item.deelnames = item.deelnames.filter((e) => e.type === 'medewerker' || e.type === 'groep');
		for (const person of item.deelnames) {
			person.links = undefined;
		}
	}
}

type AbsenceNoticeFetchResult = {
	notices: AbsenceNotice[];
	loadedDateKeys: string[];
	failedDateKeys: string[];
};

function nextAbsenceNoticeLoad(
	studentId: number,
	dateKeys: string[],
	refresh: boolean,
	absenceNoticeResult: AbsenceNoticeFetchResult,
) {
	const currentLoad = studentDataStore.getAbsenceNoticeLoad(studentId);
	const baseLoad = refresh ? resetDays(currentLoad, dateKeys) : currentLoad;
	return {
		currentLoad,
		absenceNoticeLoad: applyFetchResult(
			baseLoad,
			absenceNoticeResult.loadedDateKeys,
			absenceNoticeResult.failedDateKeys,
		),
	};
}

function studentStateUnchanged(
	currentAgenda: StudentWrite['agenda'],
	updatedAgenda: StudentWrite['agenda'],
	currentLoad: ReturnType<typeof studentDataStore.getAbsenceNoticeLoad>,
	absenceNoticeLoad: ReturnType<typeof studentDataStore.getAbsenceNoticeLoad>,
): boolean {
	if (!deepEqual(currentAgenda, updatedAgenda)) return false;
	return deepEqual(currentLoad, absenceNoticeLoad);
}

function mergeStudentAgendaState(
	currentStudent: StudentWrite,
	studentId: number,
	updatedAgenda: StudentWrite['agenda'],
	dateKeys: string[],
	refresh: boolean,
	absenceNoticeResult: AbsenceNoticeFetchResult,
	changedFlag: { agendaChanged: boolean },
): StudentWrite | null {
	const currentAgenda = currentStudent.agenda;
	const { currentLoad, absenceNoticeLoad } = nextAbsenceNoticeLoad(studentId, dateKeys, refresh, absenceNoticeResult);

	if (studentStateUnchanged(currentAgenda, updatedAgenda, currentLoad, absenceNoticeLoad)) return null;

	changedFlag.agendaChanged = !deepEqual(currentAgenda, updatedAgenda);
	return {
		...currentStudent,
		agenda: updatedAgenda,
		absenceNoticeLoad,
	};
}

function applyAgendaFetchToStudents(
	prev: StudentWrite[],
	studentId: number,
	dailyItems: Record<string, AgendaEntry[]>,
	dateKeys: string[],
	refresh: boolean,
	absenceNoticeResult: AbsenceNoticeFetchResult,
	changedFlag: { agendaChanged: boolean },
): StudentWrite[] {
	const index = prev.findIndex((s) => s.id === studentId);
	if (index === -1) return prev;

	const currentStudent = prev[index];
	const updatedAgenda = mergeFetchedAgendaForRange(currentStudent.agenda, dailyItems, dateKeys);
	const updatedStudent = mergeStudentAgendaState(
		currentStudent,
		studentId,
		updatedAgenda,
		dateKeys,
		refresh,
		absenceNoticeResult,
		changedFlag,
	);
	if (!updatedStudent) return prev;

	const newStudents = [...prev];
	newStudents[index] = updatedStudent;
	return newStudents;
}

function invalidateCachesIfRefresh(refresh: boolean, startDate: Date, endDate: Date): void {
	if (!refresh) return;
	invalidateReturnMeasureCache(eachMonthKey(startDate, endDate));
}

async function fetchAgendaSources(
	studentId: number,
	startDate: Date,
	endDate: Date,
	startDateKey: string,
	endDateKey: string,
	dateKeys: string[],
	refresh: boolean,
	student: Student | undefined,
) {
	return Promise.all([
		getJson<AgendaResponse>(endpoints.agenda(studentId, startDateKey, endDateKey), 'include', 'no-cache'),
		getReturnMeasuresForRange(startDate, endDate),
		fetchAbsenceNoticesForStudent(student?.externeId, dateKeys, refresh),
		loadRegistrationEntriesForStudent(studentId, dateKeys, student?.agenda, refresh),
	]);
}

async function loadAgendaPayload(
	studentId: number,
	startDate: Date,
	endDate: Date,
	startDateKey: string,
	endDateKey: string,
	dateKeys: string[],
	refresh: boolean,
	student: Student | undefined,
) {
	invalidateCachesIfRefresh(refresh, startDate, endDate);

	const [data, allReturnMeasures, absenceNoticeResult, registrationEntries] = await fetchAgendaSources(
		studentId,
		startDate,
		endDate,
		startDateKey,
		endDateKey,
		dateKeys,
		refresh,
		student,
	);

	const returnMeasures = scheduledReturnMeasuresForStudent(allReturnMeasures, studentId, startDate, endDate);
	sanitizeAgendaItemDeelnames(data.items);

	const entries = buildAgendaEntries(
		data.items,
		returnMeasures,
		absenceNoticeResult.notices,
		registrationEntries,
		startDate,
		endDate,
	);

	return { entries, absenceNoticeResult, dateKeys };
}

function logAgendaLoadFailure(studentId: number, error: unknown): void {
	if (isMagisterUnavailableError(error)) return;
	console.error('Failed to fetch agenda for student', studentId, error);
}

async function runAgendaLoad(
	studentId: number,
	startDate: Date,
	endDate: Date,
	refresh: boolean,
	studentsRef: { current: Student[] },
	setStudents: Dispatch<SetStateAction<StudentWrite[]>>,
): Promise<{ entries: AgendaEntry[]; changed: boolean }> {
	const startDateKey = getDateKey(startDate);
	const endDateKey = getDateKey(endDate);
	const dateKeys = eachDateKey(startDate, endDate);
	const student = studentsRef.current.find((item) => item.id === studentId);

	const { entries, absenceNoticeResult } = await loadAgendaPayload(
		studentId,
		startDate,
		endDate,
		startDateKey,
		endDateKey,
		dateKeys,
		refresh,
		student,
	);

	const changedFlag = { agendaChanged: false };
	const dailyItems = groupBy(entries, (entry) => getDateKey(new Date(entry.start)));

	setStudents((prev) =>
		applyAgendaFetchToStudents(prev, studentId, dailyItems, dateKeys, refresh, absenceNoticeResult, changedFlag),
	);

	return { entries, changed: changedFlag.agendaChanged };
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
					return await runAgendaLoad(studentId, startDate, endDate, refresh, studentsRef, setStudents);
				} catch (e) {
					logAgendaLoadFailure(studentId, e);
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
