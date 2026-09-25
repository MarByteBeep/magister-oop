/** Per-day bookkeeping for absence-notice fetches (not the notice payloads themselves). */
export type AbsenceNoticeLoadDayState = {
	loaded: boolean;
	fetchAttempts?: number;
};

export const MAX_ABSENCE_NOTICE_FETCH_ATTEMPTS = 3;

/** Loaded successfully, or auto-fetch gave up after repeated failures. */
export function isFetchSettled(
	loadByDate: Record<string, AbsenceNoticeLoadDayState> | undefined,
	dateKey: string,
): boolean {
	const day = loadByDate?.[dateKey];
	if (day?.loaded === true) return true;
	return (day?.fetchAttempts ?? 0) >= MAX_ABSENCE_NOTICE_FETCH_ATTEMPTS;
}

export function markDaysLoaded(
	loadByDate: Record<string, AbsenceNoticeLoadDayState> | undefined,
	dateKeys: string[],
): Record<string, AbsenceNoticeLoadDayState> | undefined {
	if (dateKeys.length === 0) return loadByDate;

	const next = { ...loadByDate };
	for (const dateKey of dateKeys) {
		next[dateKey] = { loaded: true };
	}
	return next;
}

export function applyFetchResult(
	loadByDate: Record<string, AbsenceNoticeLoadDayState> | undefined,
	loadedDateKeys: string[],
	failedDateKeys: string[],
): Record<string, AbsenceNoticeLoadDayState> | undefined {
	let next = markDaysLoaded(loadByDate, loadedDateKeys);
	if (failedDateKeys.length === 0) return next;

	next = { ...next };
	for (const dateKey of failedDateKeys) {
		const previousAttempts = next[dateKey]?.fetchAttempts ?? 0;
		next[dateKey] = { loaded: false, fetchAttempts: previousAttempts + 1 };
	}
	return next;
}

export function resetDays(
	loadByDate: Record<string, AbsenceNoticeLoadDayState> | undefined,
	dateKeys: string[],
): Record<string, AbsenceNoticeLoadDayState> | undefined {
	if (!loadByDate || dateKeys.length === 0) return loadByDate;

	const next = { ...loadByDate };
	let changed = false;
	for (const dateKey of dateKeys) {
		if (dateKey in next) {
			delete next[dateKey];
			changed = true;
		}
	}
	if (!changed) return loadByDate;
	return Object.keys(next).length === 0 ? undefined : next;
}
