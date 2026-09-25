'use client';

import ReturnMeasureModal from '@/components/returnMeasures/ReturnMeasureModal';
import StudentModal from '@/components/StudentModal';
import type { StudentDetailTab } from '@/components/student/StudentDetailContent';
import type { ReturnMeasureStudent } from '@/magister/response/return-measure.types';
import type { Student } from '@/types/student.types';

interface ReturnMeasuresDialogsProps {
	selectedMeasure: ReturnMeasureStudent | null;
	selectedStudent: Student | undefined;
	studentTab: StudentDetailTab;
	agendaDate: Date | undefined;
	onCloseMeasure: () => void;
	onOpenStudentFromMeasure: (opened: Student, options?: { tab?: StudentDetailTab; date?: Date }) => void;
	onCloseStudent: () => void;
}

export default function ReturnMeasuresDialogs({
	selectedMeasure,
	selectedStudent,
	studentTab,
	agendaDate,
	onCloseMeasure,
	onOpenStudentFromMeasure,
	onCloseStudent,
}: ReturnMeasuresDialogsProps) {
	return (
		<>
			{selectedMeasure && (
				<ReturnMeasureModal
					measure={selectedMeasure}
					isOpen={selectedMeasure !== null}
					onClose={onCloseMeasure}
					onOpenStudent={onOpenStudentFromMeasure}
				/>
			)}

			{selectedStudent && (
				<StudentModal
					student={selectedStudent}
					initialTab={studentTab}
					agendaDate={agendaDate}
					onClose={onCloseStudent}
				/>
			)}
		</>
	);
}
