import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';
import type { StaffMember } from '@/magister/response/staffMember.types';
import type { StudentBase } from '@/magister/response/student.types';
import { expandOneTemplate, toStudentDetails } from './returnMeasureExpand';
import type { StoredReturnMeasureTemplate } from './returnMeasures.types';

export type { StoredReturnMeasureTemplate } from './returnMeasures.types';

export function expandReturnMeasureTemplates(
	templates: StoredReturnMeasureTemplate[],
	student: StudentBase,
	staffById: Map<number, StaffMember>,
	beginParam: string,
	endParam: string,
): ReturnMeasureStudent[] {
	const studentDetails = toStudentDetails(student);
	return templates.flatMap((template) =>
		expandOneTemplate(template, studentDetails, student.id, staffById, beginParam, endParam),
	);
}
