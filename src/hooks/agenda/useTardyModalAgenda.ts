import { useEffect, useState } from 'react';
import { agendaEntriesForDate } from '@/lib/agenda/loadUtils';
import { getDateKey, getNow, getWorkWeekRange } from '@/lib/shared/dateUtils';
import type { AgendaEntry } from '@/magister/response/agendaEntry.types';
import type { Student } from '@/types/student.types';
import type { LoadAgendaForStudentFn } from '@/types/students.types';

function findStudentAgendaForToday(
	students: Student[],
	studentId: number,
	todayKey: string,
): AgendaEntry[] | undefined {
	const studentFromContext = students.find((s) => s.id === studentId);
	if (!studentFromContext) return undefined;
	const agenda = studentFromContext.agenda;
	if (!agenda) return undefined;
	return agenda[todayKey];
}

async function loadTodayAgendaEntries(
	studentId: number,
	todayKey: string,
	loadAgendaForStudent: LoadAgendaForStudentFn,
): Promise<AgendaEntry[]> {
	const today = getNow();
	const { start, end } = getWorkWeekRange(today);
	const { entries } = await loadAgendaForStudent(studentId, start, end);
	return agendaEntriesForDate(entries, todayKey);
}

function applyCachedAgenda(
	agendaForToday: AgendaEntry[],
	cancelled: boolean,
	setAgendaEntries: (entries: AgendaEntry[]) => void,
	setIsLoading: (loading: boolean) => void,
) {
	if (cancelled) return;
	setAgendaEntries(agendaForToday);
	setIsLoading(false);
}

function loadRemoteAgenda(
	studentId: number,
	todayKey: string,
	loadAgendaForStudent: LoadAgendaForStudentFn,
	cancelled: () => boolean,
	setAgendaEntries: (entries: AgendaEntry[]) => void,
	setIsLoading: (loading: boolean) => void,
) {
	setIsLoading(true);
	loadTodayAgendaEntries(studentId, todayKey, loadAgendaForStudent)
		.then((entries) => {
			if (cancelled()) return;
			setAgendaEntries(entries);
		})
		.catch(() => {
			if (cancelled()) return;
			setAgendaEntries([]);
		})
		.finally(() => {
			if (cancelled()) return;
			setIsLoading(false);
		});
}

function resetAgendaState(
	setAgendaEntries: (entries: AgendaEntry[]) => void,
	setIsLoading: (loading: boolean) => void,
) {
	setAgendaEntries([]);
	setIsLoading(false);
}

type TardyAgendaEffectArgs = {
	isOpen: boolean;
	studentId: number | undefined;
	students: Student[];
	loadAgendaForStudent: LoadAgendaForStudentFn;
	setAgendaEntries: (entries: AgendaEntry[]) => void;
	setIsLoading: (loading: boolean) => void;
};

function startTardyAgendaLoad(args: TardyAgendaEffectArgs & { studentId: number }): () => void {
	let cancelled = false;
	const todayKey = getDateKey(getNow());
	const agendaForToday = findStudentAgendaForToday(args.students, args.studentId, todayKey);

	if (agendaForToday) {
		applyCachedAgenda(agendaForToday, cancelled, args.setAgendaEntries, args.setIsLoading);
	} else {
		loadRemoteAgenda(
			args.studentId,
			todayKey,
			args.loadAgendaForStudent,
			() => cancelled,
			args.setAgendaEntries,
			args.setIsLoading,
		);
	}

	return () => {
		cancelled = true;
	};
}

function runTardyAgendaEffect(args: TardyAgendaEffectArgs): (() => void) | undefined {
	if (!args.isOpen) {
		resetAgendaState(args.setAgendaEntries, args.setIsLoading);
		return undefined;
	}
	if (args.studentId === undefined) {
		resetAgendaState(args.setAgendaEntries, args.setIsLoading);
		return undefined;
	}
	return startTardyAgendaLoad({ ...args, studentId: args.studentId });
}

export function useTardyModalAgenda(
	isOpen: boolean,
	studentId: number | undefined,
	students: Student[],
	loadAgendaForStudent: LoadAgendaForStudentFn,
) {
	const [agendaEntries, setAgendaEntries] = useState<AgendaEntry[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		return runTardyAgendaEffect({
			isOpen,
			studentId,
			students,
			loadAgendaForStudent,
			setAgendaEntries,
			setIsLoading,
		});
	}, [isOpen, studentId, students, loadAgendaForStudent]);

	return { agendaEntries, isLoading };
}
