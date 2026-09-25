'use client';

import StudentItem from '@/components/student/StudentItem';
import type { Student } from '@/types/student.types';
import type { OccupancyClassGroup } from './useOccupancyStudentsModalData';

const MAX_LABEL_LENGTH = 40;

function capLabel(text: string): string {
	return text.length > MAX_LABEL_LENGTH ? `${text.slice(0, MAX_LABEL_LENGTH - 1)}…` : text;
}

function formatClassGroupTitle(group: OccupancyClassGroup, cap = false): string {
	const parts = [`Klas: ${group.className}`];
	if (group.subject) parts.push(cap ? capLabel(group.subject) : group.subject);
	if (group.teacher) parts.push(cap ? capLabel(group.teacher) : group.teacher);
	return parts.join(', ');
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
			{classGroups.map((group) => {
				const title = formatClassGroupTitle(group, true);
				const fullTitle = formatClassGroupTitle(group);

				return (
					<div key={group.className} className="border rounded-md p-3 bg-card">
						<h4 className="font-semibold text-lg mb-2 text-foreground truncate" title={fullTitle}>
							{title}
						</h4>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{group.students.map((student) => (
								<StudentItem
									key={student.id}
									student={student}
									onClick={() => onStudentClick(student)}
								/>
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}
