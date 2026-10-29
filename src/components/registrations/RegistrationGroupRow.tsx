'use client';

import RegistrationHourIndicator from '@/components/registrations/RegistrationHourIndicator';
import { rowButtonClassName, studentPhotoHref } from '@/components/registrations/registrationGroupRowUtils';
import type { RegistrationRow } from '@/lib/registrations/utils';
import { getInitials } from '@/lib/shared/stringUtils';
import type { Student } from '@/types/student.types';
import LazyAvatar from '../LazyAvatar';

export interface RegistrationGroupRowProps {
	registrations: RegistrationRow[];
	student?: Student;
	onSelectStudent: (studentId: number) => void;
}

function ClassCodeLabel({ classCode }: { classCode: string | undefined }) {
	if (!classCode) return null;
	return <span className="text-muted-foreground">({classCode})</span>;
}

function selectStudentHandler(student: Student | undefined, onSelectStudent: (studentId: number) => void) {
	if (!student) return;
	onSelectStudent(student.id);
}

export default function RegistrationGroupRow({ registrations, student, onSelectStudent }: RegistrationGroupRowProps) {
	const first = registrations[0];
	if (!first) return null;

	const clickable = Boolean(student);

	return (
		<button
			type="button"
			disabled={!clickable}
			className={rowButtonClassName(clickable)}
			onClick={() => selectStudentHandler(student, onSelectStudent)}
		>
			<div className="flex items-center gap-3 min-w-0">
				<LazyAvatar
					src={studentPhotoHref(student)}
					alt={first.studentName}
					initials={getInitials(first.studentName)}
					className="h-10 w-10"
				/>
				<div className="flex flex-col min-w-0">
					<span className="font-medium text-foreground truncate">
						{first.studentName} <ClassCodeLabel classCode={first.classCode} />
					</span>
				</div>
			</div>
			<div className="flex items-center gap-1 shrink-0">
				{registrations.map((row) => (
					<RegistrationHourIndicator key={row.id} row={row} student={student} />
				))}
			</div>
		</button>
	);
}
