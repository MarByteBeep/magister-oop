'use client';

import type { StudentDetailTab } from '@/components/student/StudentDetailContent';
import type { Student } from '@/types/student.types';
import StudentDetailDialog from './student/StudentDetailDialog';

interface StudentModalProps {
	student?: Student;
	onClose: () => void;
	initialTab?: StudentDetailTab;
	agendaDate?: Date;
}

export default function StudentModal({ student, onClose, initialTab, agendaDate }: StudentModalProps) {
	return <StudentDetailDialog student={student} onClose={onClose} initialTab={initialTab} agendaDate={agendaDate} />;
}
