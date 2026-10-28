'use client';

import type { ReactNode } from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ReturnMeasureReportedConfirmBodyProps {
	title: string;
	body?: string;
	studentChip: ReactNode;
}

export default function ReturnMeasureReportedConfirmBody({
	title,
	body,
	studentChip,
}: ReturnMeasureReportedConfirmBodyProps) {
	return (
		<>
			<DialogHeader>
				<DialogTitle>{title}</DialogTitle>
			</DialogHeader>
			<div className="space-y-3">
				{body ? <p className="text-sm text-muted-foreground">{body}</p> : null}
				{studentChip}
			</div>
		</>
	);
}
