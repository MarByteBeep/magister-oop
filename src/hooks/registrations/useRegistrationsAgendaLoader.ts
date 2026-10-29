import { useEffect, useMemo, useState } from 'react';
import { needsAgendaDayFetch } from '@/lib/agenda/loadUtils';
import { getNow, getWorkWeekRange } from '@/lib/shared/dateUtils';
import { createLimiter } from '@/lib/shared/limiter';
import { studentDataStore } from '@/lib/students/dataStore';
import type { RegistrationsResponse } from '@/magister/response/registrations.types';
import type { Student } from '@/types/student.types';
import type { LoadAgendaForStudentFn } from '@/types/students.types';

function studentNeedsAgendaFetch(student: Student, todayKey: string): boolean {
	return needsAgendaDayFetch(student.agenda, todayKey, studentDataStore.getAbsenceNoticeLoad(student.id));
}

function isAllowedPendingStudent(
	student: Student,
	allowedStudentIds: Set<number>,
	agendaLoadedForStudentIds: Set<number>,
): boolean {
	if (!allowedStudentIds.has(student.id)) return false;
	return !agendaLoadedForStudentIds.has(student.id);
}

function shouldQueueAgendaLoad(
	student: Student | undefined,
	allowedStudentIds: Set<number>,
	todayKey: string,
	agendaLoadedForStudentIds: Set<number>,
): student is Student {
	if (!student) return false;
	if (!isAllowedPendingStudent(student, allowedStudentIds, agendaLoadedForStudentIds)) return false;
	return studentNeedsAgendaFetch(student, todayKey);
}

function registrationItems(data: RegistrationsResponse): RegistrationsResponse['items'] {
	return data.items ?? [];
}

function collectStudentIdsNeedingAgenda(
	data: RegistrationsResponse,
	students: Student[],
	allowedStudentIds: Set<number>,
	todayKey: string,
	agendaLoadedForStudentIds: Set<number>,
): Set<number> {
	const studentMap = new Map(students.map((s) => [s.id, s]));
	const ids = new Set<number>();
	for (const item of registrationItems(data)) {
		const student = studentMap.get(item.id);
		if (!shouldQueueAgendaLoad(student, allowedStudentIds, todayKey, agendaLoadedForStudentIds)) continue;
		ids.add(student.id);
	}
	return ids;
}

function markAgendaLoaded(
	setAgendaLoadedForStudentIds: (updater: (prev: Set<number>) => Set<number>) => void,
	id: number,
) {
	setAgendaLoadedForStudentIds((prev) => {
		const next = new Set(prev);
		next.add(id);
		return next;
	});
}

async function loadAgendaForQueuedIds(
	ids: Set<number>,
	agendaLimiter: ReturnType<typeof createLimiter>,
	loadAgendaForStudent: LoadAgendaForStudentFn,
	isCancelled: () => boolean,
	setAgendaLoadedForStudentIds: (updater: (prev: Set<number>) => Set<number>) => void,
): Promise<void> {
	const { start, end } = getWorkWeekRange(getNow());
	await Promise.allSettled(
		Array.from(ids).map((id) =>
			agendaLimiter(async () => {
				if (isCancelled()) return;
				try {
					await loadAgendaForStudent(id, start, end);
				} finally {
					markAgendaLoaded(setAgendaLoadedForStudentIds, id);
				}
			}),
		),
	);
}

export function useRegistrationsAgendaLoader(
	data: RegistrationsResponse | null,
	students: Student[],
	allowedStudentIds: Set<number>,
	todayKey: string,
	loadAgendaForStudent: LoadAgendaForStudentFn,
) {
	const agendaLimiter = useMemo(() => createLimiter(3, 150), []);
	const [agendaLoadedForStudentIds, setAgendaLoadedForStudentIds] = useState<Set<number>>(new Set());

	useEffect(() => {
		if (!data) return;

		const ids = collectStudentIdsNeedingAgenda(
			data,
			students,
			allowedStudentIds,
			todayKey,
			agendaLoadedForStudentIds,
		);
		if (ids.size === 0) return;

		let cancelled = false;
		void loadAgendaForQueuedIds(
			ids,
			agendaLimiter,
			loadAgendaForStudent,
			() => cancelled,
			setAgendaLoadedForStudentIds,
		);

		return () => {
			cancelled = true;
		};
	}, [data, allowedStudentIds, agendaLoadedForStudentIds, agendaLimiter, loadAgendaForStudent, students, todayKey]);
}
