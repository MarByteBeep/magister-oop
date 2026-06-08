'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { Student } from '@/magister/types';
import StudentDetailContent from './StudentDetailContent';

interface StudentDetailDialogProps {
	student?: Student | null;
	onClose: () => void;
}

export default function StudentDetailDialog({ student, onClose }: StudentDetailDialogProps) {
	const [nestedStudent, setNestedStudent] = useState<Student | null>(null);
	const studentId = student?.id;

	return (
		<>
			<Dialog
				open={studentId !== null && studentId !== undefined}
				onOpenChange={(isOpen: boolean) => !isOpen && onClose()}
			>
				<DialogContent className="w-[1100px] h-[700px] flex flex-col">
					<StudentDetailContent student={student ?? undefined} onOpenStudent={setNestedStudent} />
				</DialogContent>
			</Dialog>

			{nestedStudent && <StudentDetailDialog student={nestedStudent} onClose={() => setNestedStudent(null)} />}
		</>
	);
}
