'use client';

import StudentItem from '@/components/student/StudentItem';
import type { Student } from '@/types/student.types';
import type { OccupancyClassGroup } from './useOccupancyStudentsModalData';

const MAX_LABEL_LENGTH = 40;

function capLabel(text: string): string {
	if (text.length <= MAX_LABEL_LENGTH) return text;
	return `${text.slice(0, MAX_LABEL_LENGTH - 1)}…`;
}

function formatOptionalPart(value: string | undefined, cap: boolean): string[] {
	if (!value) return [];
	if (!cap) return [value];
	return [capLabel(value)];
}

function formatClassGroupTitle(group: OccupancyClassGroup, cap: boolean): string {
	return [
		`Klas: ${group.className}`,
		...formatOptionalPart(group.subject, cap),
		...formatOptionalPart(group.teacher, cap),
	].join(', ');
}

function ClassGroupSection({
	group,
	onStudentClick,
}: {
	group: OccupancyClassGroup;
	onStudentClick: (student: Student) => void;
}) {
	const title = formatClassGroupTitle(group, true);
	const fullTitle = formatClassGroupTitle(group, false);

	return (
		<div className="border rounded-md p-3 bg-card">
			<h4 className="font-semibold text-lg mb-2 text-foreground truncate" title={fullTitle}>
				{title}
			</h4>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{group.students.map((student) => (
					<StudentItem key={student.id} student={student} onClick={() => onStudentClick(student)} />
				))}
			</div>
		</div>
	);
}

export default function OccupancyStudentsByClass({
	classGroups,
	onStudentClick,
}: {
	classGroups: OccupancyClassGroup[];
	onStudentClick: (student: Student) => void;
}) {
	return (
		<div className="space-y-4">
			{classGroups.map((group) => (
				<ClassGroupSection key={group.className} group={group} onStudentClick={onStudentClick} />
			))}
		</div>
	);
}
