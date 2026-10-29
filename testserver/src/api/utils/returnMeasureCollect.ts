import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';
import type { StaffMember } from '@/magister/response/staffMember.types';
import type { StudentBase } from '@/magister/response/student.types';
import { getAllStaffMembers, getAllStudents, getReturnMeasureTemplates } from './helpers';
import { expandReturnMeasureTemplates } from './returnMeasures';
import type { StoredReturnMeasureTemplate } from './returnMeasures.types';

function measuresForStudent(
	student: StudentBase,
	templatesByStudent: Record<number, StoredReturnMeasureTemplate[]>,
	staffById: Map<number, StaffMember>,
	beginParam: string,
	endParam: string,
): ReturnMeasureStudent[] {
	const templates = templatesByStudent[student.id] ?? [];
	if (templates.length === 0) return [];
	return expandReturnMeasureTemplates(templates, student, staffById, beginParam, endParam);
}

export function collectReturnMeasures(beginParam: string, endParam: string): ReturnMeasureStudent[] {
	const templatesByStudent = getReturnMeasureTemplates();
	const staffById = new Map(getAllStaffMembers().map((staffMember) => [staffMember.id, staffMember]));
	const items: ReturnMeasureStudent[] = [];

	for (const student of getAllStudents()) {
		items.push(...measuresForStudent(student, templatesByStudent, staffById, beginParam, endParam));
	}

	return items;
}

export function beginEndParams(req: Request): { beginParam: string; endParam: string } {
	const url = new URL(req.url);
	return {
		beginParam: url.searchParams.get('begin') ?? '',
		endParam: url.searchParams.get('einde') ?? '',
	};
}
