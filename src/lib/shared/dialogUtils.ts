/** Radix `onOpenChange` helper: run `onClose` only when the dialog is dismissed. */
export function closeWhenDismissed(onClose: () => void) {
	return (open: boolean) => {
		if (open) return;
		onClose();
	};
}
