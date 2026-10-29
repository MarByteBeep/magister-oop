import { type ReactNode, useEffect, useState } from 'react';
import { MagisterSessionContext } from '@/context/MagisterSessionContext';
import {
	isMagisterSessionStatus,
	MAGISTER_SESSION_KEY,
	type MagisterSessionStatus,
	requestMagisterSessionVerification,
} from '@/lib/session/magisterSession';

/** Magister can drop the session while the popup sits idle, without any API call failing. */
const SESSION_VERIFY_INTERVAL_MS = 60_000;

export function MagisterSessionProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<MagisterSessionStatus>(() => (import.meta.env.DEV ? 'ready' : 'checking'));

	useEffect(() => {
		if (import.meta.env.DEV) return;

		let cancelled = false;
		void chrome.storage.session.get(MAGISTER_SESSION_KEY).then((stored) => {
			if (cancelled) return;
			const value = stored[MAGISTER_SESSION_KEY];
			if (isMagisterSessionStatus(value)) setStatus(value);
		});

		const applySessionChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
			const change = changes[MAGISTER_SESSION_KEY];
			if (!change) return;
			const value = change.newValue;
			if (isMagisterSessionStatus(value)) setStatus(value);
		};
		const onChanged = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
			if (area !== 'session') return;
			applySessionChange(changes);
		};
		chrome.storage.onChanged.addListener(onChanged);
		return () => {
			cancelled = true;
			chrome.storage.onChanged.removeListener(onChanged);
		};
	}, []);

	useEffect(() => {
		if (import.meta.env.DEV || status !== 'ready') return;

		const interval = setInterval(requestMagisterSessionVerification, SESSION_VERIFY_INTERVAL_MS);
		window.addEventListener('focus', requestMagisterSessionVerification);
		return () => {
			clearInterval(interval);
			window.removeEventListener('focus', requestMagisterSessionVerification);
		};
	}, [status]);

	return <MagisterSessionContext.Provider value={status}>{children}</MagisterSessionContext.Provider>;
}
