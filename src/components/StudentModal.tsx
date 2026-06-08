'use client';

import type { Student } from '@/magister/types';
import StudentDetailDialog from './student/StudentDetailDialog';

interface StudentModalProps {
	student?: Student;
	onClose: () => void;
}

export default function StudentModal({ student, onClose }: StudentModalProps) {
	return <StudentDetailDialog student={student} onClose={onClose} />;
}
