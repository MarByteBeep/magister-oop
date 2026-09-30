'use client';

import type { StudentDetailTab } from '@/components/student/profile/StudentDetailContent';
import StudentDetailDialog from '@/components/student/profile/StudentDetailDialog';
import type { Student } from '@/types/student.types';

interface StudentModalProps {
	student?: Student;
	onClose: () => void;
	initialTab?: StudentDetailTab;
	agendaDate?: Date;
}

export default function StudentModal({ student, onClose, initialTab, agendaDate }: StudentModalProps) {
	return <StudentDetailDialog student={student} onClose={onClose} initialTab={initialTab} agendaDate={agendaDate} />;
}
