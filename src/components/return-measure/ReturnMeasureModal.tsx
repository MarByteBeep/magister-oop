'use client';

import ReturnMeasureModalBody from '@/components/return-measure/ReturnMeasureModalBody';
import StudentItem from '@/components/student/StudentItem';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useReturnMeasureModal } from '@/hooks/return-measure/useReturnMeasureModal';
import { closeWhenDismissed } from '@/lib/shared/dialogUtils';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';
import type { Student } from '@/types/student.types';

export interface ReturnMeasureModalProps {
	measure: ReturnMeasureStudent;
	isOpen: boolean;
	onClose: () => void;
	onOpenStudent?: (student: Student, options?: { tab?: 'gegevens' | 'agenda'; date?: Date }) => void;
}

function studentClickHandler(
	student: Student | undefined,
	onOpenStudent?: (student: Student) => void,
): (() => void) | undefined {
	if (!student) return undefined;
	if (!onOpenStudent) return undefined;
	return () => onOpenStudent(student);
}

function ReturnMeasureModalHeader({
	student,
	studentName,
	photoUrl,
	classLabel,
	onOpenStudent,
}: {
	student: Student | undefined;
	studentName: string;
	photoUrl: string | undefined;
	classLabel: string;
	onOpenStudent?: (student: Student) => void;
}) {
	return (
		<DialogHeader className="pr-8">
			<DialogTitle className="sr-only">{studentName}</DialogTitle>
			<StudentItem
				student={student}
				name={studentName}
				photoUrl={photoUrl}
				classLabel={classLabel}
				variant="plain"
				className="p-2"
				onClick={studentClickHandler(student, onOpenStudent)}
			/>
		</DialogHeader>
	);
}

export default function ReturnMeasureModal({
	measure: source,
	isOpen,
	onClose,
	onOpenStudent,
}: ReturnMeasureModalProps) {
	const model = useReturnMeasureModal(source, onClose, onOpenStudent);

	return (
		<Dialog open={isOpen} onOpenChange={closeWhenDismissed(onClose)}>
			<DialogContent className="max-w-[800px]">
				<ReturnMeasureModalHeader
					student={model.student}
					studentName={model.studentName}
					photoUrl={model.photoUrl}
					classLabel={model.classLabel}
					onOpenStudent={onOpenStudent}
				/>
				<ReturnMeasureModalBody
					measure={model.measure}
					measureTitle={model.measureTitle}
					display={model.display}
					canOpenAgenda={model.canOpenAgenda}
					onOpenAgenda={model.openAgenda}
					planning={model.planning}
					reportStatus={model.reportStatus}
					student={model.student}
					studentName={model.studentName}
					classLabel={model.classLabel}
				/>
			</DialogContent>
		</Dialog>
	);
}
