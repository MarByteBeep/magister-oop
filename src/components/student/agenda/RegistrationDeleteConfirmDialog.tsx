import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface RegistrationDeleteConfirmDialogProps {
	description: string;
	isDeleting: boolean;
	isOpen: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}

export default function RegistrationDeleteConfirmDialog({
	description,
	isDeleting,
	isOpen,
	onCancel,
	onConfirm,
}: RegistrationDeleteConfirmDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onCancel()}>
			<DialogContent className="max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Registratie verwijderen</DialogTitle>
				</DialogHeader>
				<p className="text-sm text-muted-foreground">
					Weet je zeker dat je de registratie “{description}” wilt verwijderen?
				</p>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={onCancel} disabled={isDeleting}>
						Annuleren
					</Button>
					<Button type="button" variant="destructive" onClick={() => void onConfirm()} disabled={isDeleting}>
						Verwijderen
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
