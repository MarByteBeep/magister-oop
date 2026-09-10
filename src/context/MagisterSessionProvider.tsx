import { type ReactNode, useEffect, useState } from 'react';
import { MagisterSessionContext } from '@/context/MagisterSessionContext';
import { isMagisterSessionStatus, MAGISTER_SESSION_KEY, type MagisterSessionStatus } from '@/lib/magisterSession';

export function MagisterSessionProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<MagisterSessionStatus>(() => (import.meta.env.DEV ? 'ready' : 'connecting'));

	useEffect(() => {
		if (import.meta.env.DEV) return;

		let cancelled = false;
		void chrome.storage.session.get(MAGISTER_SESSION_KEY).then((stored) => {
			if (cancelled) return;
			const value = stored[MAGISTER_SESSION_KEY];
			if (isMagisterSessionStatus(value)) setStatus(value);
		});

		const onChanged = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
			if (area !== 'session' || !changes[MAGISTER_SESSION_KEY]) return;
			const value = changes[MAGISTER_SESSION_KEY].newValue;
			if (isMagisterSessionStatus(value)) setStatus(value);
		};
		chrome.storage.onChanged.addListener(onChanged);
		return () => {
			cancelled = true;
			chrome.storage.onChanged.removeListener(onChanged);
		};
	}, []);

	return <MagisterSessionContext.Provider value={status}>{children}</MagisterSessionContext.Provider>;
}
