'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { AbsenceNotice } from '@/magister/response/absenceNotice.types';

interface AbsenceNoticeDeleteConfirmModalProps {
	notice: AbsenceNotice | null;
	isSubmitting: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function AbsenceNoticeDeleteConfirmModal({
	notice,
	isSubmitting,
	onConfirm,
	onCancel,
}: AbsenceNoticeDeleteConfirmModalProps) {
	return (
		<Dialog open={notice != null} onOpenChange={(open) => !open && !isSubmitting && onCancel()}>
			<DialogContent className="max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Afwezigheid verwijderen</DialogTitle>
				</DialogHeader>
				<p className="text-sm text-muted-foreground">
					Weet je zeker dat je de afwezigheid “{notice?.attendanceTypeDescription ?? ''}” wilt verwijderen?
				</p>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
						Annuleren
					</Button>
					<Button type="button" variant="destructive" onClick={onConfirm} disabled={isSubmitting}>
						Verwijderen
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
