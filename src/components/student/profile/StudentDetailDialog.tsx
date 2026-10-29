'use client';

import { useState } from 'react';
import StudentDetailContent, { type StudentDetailTab } from '@/components/student/profile/StudentDetailContent';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { Student } from '@/types/student.types';

export interface StudentDetailDialogProps {
	student?: Student | null;
	onClose: () => void;
	initialTab?: StudentDetailTab;
	agendaDate?: Date;
}

function isStudentDialogOpen(studentId: number | undefined): boolean {
	return studentId !== undefined;
}

function handleDialogOpenChange(isOpen: boolean, onClose: () => void) {
	if (isOpen) return;
	onClose();
}

function NestedStudentDialog({ student, onClose }: { student: Student | null; onClose: () => void }) {
	if (!student) return null;
	return <StudentDetailDialog student={student} onClose={onClose} />;
}

export default function StudentDetailDialog(props: StudentDetailDialogProps) {
	const [nestedStudent, setNestedStudent] = useState<Student | null>(null);
	const studentId = props.student ? props.student.id : undefined;

	return (
		<>
			<Dialog
				open={isStudentDialogOpen(studentId)}
				onOpenChange={(isOpen: boolean) => handleDialogOpenChange(isOpen, props.onClose)}
			>
				<DialogContent className="w-[1100px] h-[700px] flex flex-col">
					<StudentDetailContent
						student={props.student ?? undefined}
						onOpenStudent={setNestedStudent}
						initialTab={props.initialTab}
						agendaDate={props.agendaDate}
					/>
				</DialogContent>
			</Dialog>

			<NestedStudentDialog student={nestedStudent} onClose={() => setNestedStudent(null)} />
		</>
	);
}
