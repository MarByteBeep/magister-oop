'use client';

import { useState } from 'react';
import { LuCheck, LuX } from 'react-icons/lu';
import ReturnMeasureReportConfirmModal from '@/components/return-measure/ReturnMeasureReportConfirmModal';
import { Button } from '@/components/ui/button';
import { returnMeasurePlanning, returnMeasureReportStatus } from '@/lib/return-measure/overview';
import { type ReturnMeasureReportAction, submitReturnMeasureReport } from '@/lib/return-measure/report';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';
import type { Student } from '@/types/student.types';

export interface ReturnMeasureReportActionsProps {
	measure: ReturnMeasureStudent;
	student?: Student;
	studentName: string;
	classLabel?: string;
}

function canShowReportActions(measure: ReturnMeasureStudent): boolean {
	if (returnMeasurePlanning(measure) !== 'open') return false;
	return returnMeasureReportStatus(measure) === 'none';
}

function fotoHref(foto: { href: string } | undefined): string | undefined {
	if (!foto) return undefined;
	return foto.href;
}

function studentReportPhotoUrl(student: Student | undefined): string | undefined {
	if (!student) return undefined;
	return fotoHref(student.links.foto);
}

function reportPhotoUrl(student: Student | undefined, measure: ReturnMeasureStudent): string | undefined {
	const fromStudent = studentReportPhotoUrl(student);
	if (fromStudent) return fromStudent;
	return fotoHref(measure.leerling.links.foto);
}

function ReportActionButtons({ onSelect }: { onSelect: (action: ReturnMeasureReportAction) => void }) {
	return (
		<fieldset className="m-0 flex shrink-0 items-center gap-1 border-0 p-0">
			<legend className="sr-only">Gemeld?</legend>
			<Button
				type="button"
				variant="outline"
				size="icon-sm"
				className="rounded-full border-primary text-primary hover:bg-primary/10 hover:text-primary"
				aria-label="Gemeld"
				title="Gemeld"
				onClick={() => onSelect('reported')}
			>
				<LuCheck className="h-4 w-4" />
			</Button>
			<Button
				type="button"
				variant="outline"
				size="icon-sm"
				className="rounded-full border-primary text-primary hover:bg-primary/10 hover:text-primary"
				aria-label="Niet gemeld"
				title="Niet gemeld"
				onClick={() => onSelect('not-reported')}
			>
				<LuX className="h-4 w-4" />
			</Button>
		</fieldset>
	);
}

function useReturnMeasureReportConfirm(measure: ReturnMeasureStudent) {
	const [pendingAction, setPendingAction] = useState<ReturnMeasureReportAction | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function confirmReport() {
		if (pendingAction === null) return;
		if (isSubmitting) return;
		setIsSubmitting(true);
		try {
			await submitReturnMeasureReport(measure, pendingAction);
		} finally {
			setIsSubmitting(false);
			setPendingAction(null);
		}
	}

	return { pendingAction, setPendingAction, isSubmitting, confirmReport };
}

export default function ReturnMeasureReportActions({
	measure,
	student,
	studentName,
	classLabel,
}: ReturnMeasureReportActionsProps) {
	const { pendingAction, setPendingAction, isSubmitting, confirmReport } = useReturnMeasureReportConfirm(measure);

	if (!canShowReportActions(measure)) return null;

	return (
		<>
			<ReportActionButtons onSelect={setPendingAction} />
			<ReturnMeasureReportConfirmModal
				action={pendingAction}
				student={student}
				studentName={studentName}
				classLabel={classLabel ?? measure.leerling.stamklas.code}
				photoUrl={reportPhotoUrl(student, measure)}
				isSubmitting={isSubmitting}
				onConfirm={() => void confirmReport()}
				onCancel={() => setPendingAction(null)}
			/>
		</>
	);
}
