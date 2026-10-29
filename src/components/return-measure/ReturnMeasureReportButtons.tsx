'use client';

import { useState } from 'react';
import ReturnMeasureReportConfirmModal from '@/components/return-measure/ReturnMeasureReportConfirmModal';
import { Button } from '@/components/ui/button';
import type { ReturnMeasureReportStatus } from '@/lib/return-measure/overview';
import { type ReturnMeasureReportAction, submitReturnMeasureReport } from '@/lib/return-measure/report';
import {
	notReportedHoverClasses,
	notReportedSolidClasses,
	reportedHoverClasses,
	reportedSolidClasses,
} from '@/lib/return-measure/reportStyles';
import { cn } from '@/lib/utils';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';
import type { Student } from '@/types/student.types';

function hrefOfFoto(foto: { href: string } | undefined): string | undefined {
	if (!foto) return undefined;
	return foto.href;
}

function studentFotoHref(student: Student | undefined): string | undefined {
	if (!student) return undefined;
	return hrefOfFoto(student.links.foto);
}

function reportPhotoUrl(student: Student | undefined, measure: ReturnMeasureStudent): string | undefined {
	const fromStudent = studentFotoHref(student);
	if (fromStudent !== undefined) return fromStudent;
	return hrefOfFoto(measure.leerling.links.foto);
}

function reportClassLabel(classLabel: string | undefined, measure: ReturnMeasureStudent): string {
	if (classLabel !== undefined) return classLabel;
	return measure.leerling.stamklas.code;
}

async function submitReturnMeasureReportAction(args: {
	measure: ReturnMeasureStudent;
	pendingAction: ReturnMeasureReportAction | null;
	isSubmitting: boolean;
	setIsSubmitting: (value: boolean) => void;
	clearPending: () => void;
}): Promise<void> {
	const { measure, pendingAction, isSubmitting, setIsSubmitting, clearPending } = args;
	if (pendingAction === null) return;
	if (isSubmitting) return;
	setIsSubmitting(true);
	try {
		await submitReturnMeasureReport(measure, pendingAction);
	} finally {
		setIsSubmitting(false);
		clearPending();
	}
}

function isReportStatus(status: ReturnMeasureReportStatus, expected: 'reported' | 'not-reported'): boolean {
	return status === expected;
}

function reportedButtonClassName(isReported: boolean): string {
	if (isReported) return cn(reportedSolidClasses, 'disabled:opacity-100');
	return reportedHoverClasses;
}

function notReportedButtonClassName(isNotReported: boolean): string {
	if (isNotReported) return cn(notReportedSolidClasses, 'disabled:opacity-100');
	return notReportedHoverClasses;
}

function reportedButtonVariant(isReported: boolean): 'default' | 'outline' {
	if (isReported) return 'default';
	return 'outline';
}

function notReportedButtonVariant(isNotReported: boolean): 'destructive' | 'outline' {
	if (isNotReported) return 'destructive';
	return 'outline';
}

function isReportActionDisabled(locked: boolean, isSubmitting: boolean): boolean {
	if (locked) return true;
	return isSubmitting;
}

function ReportedButton({
	isReported,
	isSubmitting,
	onSelect,
}: {
	isReported: boolean;
	isSubmitting: boolean;
	onSelect: (action: ReturnMeasureReportAction) => void;
}) {
	return (
		<Button
			type="button"
			variant={reportedButtonVariant(isReported)}
			disabled={isReportActionDisabled(isReported, isSubmitting)}
			aria-pressed={isReported}
			className={reportedButtonClassName(isReported)}
			onClick={() => onSelect('reported')}
		>
			Gemeld
		</Button>
	);
}

function NotReportedButton({
	isNotReported,
	isSubmitting,
	onSelect,
}: {
	isNotReported: boolean;
	isSubmitting: boolean;
	onSelect: (action: ReturnMeasureReportAction) => void;
}) {
	return (
		<Button
			type="button"
			variant={notReportedButtonVariant(isNotReported)}
			disabled={isReportActionDisabled(isNotReported, isSubmitting)}
			aria-pressed={isNotReported}
			className={notReportedButtonClassName(isNotReported)}
			onClick={() => onSelect('not-reported')}
		>
			Niet gemeld
		</Button>
	);
}

function ReturnMeasureReportActionButtons({
	reportStatus,
	isSubmitting,
	onSelect,
}: {
	reportStatus: ReturnMeasureReportStatus;
	isSubmitting: boolean;
	onSelect: (action: ReturnMeasureReportAction) => void;
}) {
	const isReported = isReportStatus(reportStatus, 'reported');
	const isNotReported = isReportStatus(reportStatus, 'not-reported');

	return (
		<div className="flex flex-wrap items-center justify-end gap-2">
			<ReportedButton isReported={isReported} isSubmitting={isSubmitting} onSelect={onSelect} />
			<NotReportedButton isNotReported={isNotReported} isSubmitting={isSubmitting} onSelect={onSelect} />
		</div>
	);
}

export interface ReturnMeasureReportButtonsProps {
	measure: ReturnMeasureStudent;
	reportStatus: ReturnMeasureReportStatus;
	student?: Student;
	studentName: string;
	classLabel?: string;
}

export default function ReturnMeasureReportButtons({
	measure,
	reportStatus,
	student,
	studentName,
	classLabel,
}: ReturnMeasureReportButtonsProps) {
	const [pendingAction, setPendingAction] = useState<ReturnMeasureReportAction | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const confirmReport = () => {
		void submitReturnMeasureReportAction({
			measure,
			pendingAction,
			isSubmitting,
			setIsSubmitting,
			clearPending: () => setPendingAction(null),
		});
	};

	return (
		<>
			<ReturnMeasureReportActionButtons
				reportStatus={reportStatus}
				isSubmitting={isSubmitting}
				onSelect={setPendingAction}
			/>
			<ReturnMeasureReportConfirmModal
				action={pendingAction}
				student={student}
				studentName={studentName}
				classLabel={reportClassLabel(classLabel, measure)}
				photoUrl={reportPhotoUrl(student, measure)}
				isSubmitting={isSubmitting}
				onConfirm={confirmReport}
				onCancel={() => setPendingAction(null)}
			/>
		</>
	);
}
