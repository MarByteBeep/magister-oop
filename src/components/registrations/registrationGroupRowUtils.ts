import { resolveRegistrationLesson } from '@/lib/registrations/lessonMatch';
import type { RegistrationRow } from '@/lib/registrations/utils';
import type { Student } from '@/types/student.types';

function formatDefinedLessonRange(start: number, end: number): string {
	if (start === end) return `${start}`;
	return `${start}-${end}`;
}

export function formatLessonRange(row: RegistrationRow): string {
	const start = row.lessonHourStart;
	const end = row.lessonHourEnd;
	if (start === undefined) return '-';
	if (end === undefined) return '-';
	return formatDefinedLessonRange(start, end);
}

export function resolveAgendaEntry(student: Student, row: RegistrationRow) {
	if (!row.start) return null;

	return resolveRegistrationLesson(student, {
		start: row.start,
		end: row.end,
		lessonHourStart: row.lessonHourStart,
		lessonHourEnd: row.lessonHourEnd,
	});
}

export function studentPhotoHref(student: Student | undefined): string | undefined {
	if (student === undefined) return undefined;
	const foto = student.links.foto;
	if (!foto) return undefined;
	return foto.href;
}

export function rowButtonClassName(clickable: boolean): string {
	const base = 'flex items-center justify-between gap-3 p-2 border rounded-md bg-muted/50 text-left';
	if (clickable) return `${base} hover:bg-muted cursor-pointer`;
	return `${base} opacity-60 cursor-not-allowed`;
}
