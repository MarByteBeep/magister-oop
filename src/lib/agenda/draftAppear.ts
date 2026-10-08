/** Survives React remounts so the draft pulse does not loop when the calendar rebuilds. */
const playedDraftAppearKeys = new Set<string>();

export function draftAppearKey(selection: { start: Date; end: Date; title?: string }): string {
	const rangeStart = selection.start <= selection.end ? selection.start : selection.end;
	const rangeEnd = selection.start <= selection.end ? selection.end : selection.start;
	return `${rangeStart.getTime()}:${rangeEnd.getTime()}:${selection.title?.trim() ?? ''}`;
}

/** Returns true only the first time this selection key should pulse. */
export function claimDraftAppear(key: string): boolean {
	if (playedDraftAppearKeys.has(key)) return false;
	playedDraftAppearKeys.add(key);
	return true;
}

export function clearDraftAppearClaims(): void {
	playedDraftAppearKeys.clear();
}
