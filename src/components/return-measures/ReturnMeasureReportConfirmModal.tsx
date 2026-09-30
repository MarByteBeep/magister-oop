'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ReturnMeasureReportAction } from '@/lib/return-measure/report';

const CONFIRM_COPY: Record<ReturnMeasureReportAction, { title: string; body: string }> = {
	reported: {
		title: 'Gemeld',
		body: 'Weet je zeker dat je wilt markeren dat deze leerling zich heeft gemeld?',
	},
	'not-reported': {
		title: 'Niet gemeld',
		body: 'Weet je zeker dat je wilt markeren dat deze leerling zich niet heeft gemeld?',
	},
};

interface ReturnMeasureReportConfirmModalProps {
	action: ReturnMeasureReportAction | null;
	studentName: string;
	isSubmitting: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function ReturnMeasureReportConfirmModal({
	action,
	studentName,
	isSubmitting,
	onConfirm,
	onCancel,
}: ReturnMeasureReportConfirmModalProps) {
	const copy = action == null ? null : CONFIRM_COPY[action];

	return (
		<Dialog open={action != null} onOpenChange={(open) => !open && !isSubmitting && onCancel()}>
			<DialogContent className="max-w-[500px]">
				<DialogHeader>
					<DialogTitle>{copy?.title}</DialogTitle>
				</DialogHeader>
				<p className="text-sm text-muted-foreground">
					{copy?.body} ({studentName})
				</p>
				<DialogFooter>
					<Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
						Annuleren
					</Button>
					<Button onClick={onConfirm} disabled={isSubmitting}>
						OK
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
