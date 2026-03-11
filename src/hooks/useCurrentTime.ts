'use client';

import { useEffect, useState } from 'react';
import { getNow } from '@/lib/dateUtils';

export function useCurrentTime(): Date {
	const [currentTime, setCurrentTime] = useState(getNow);

	useEffect(() => {
		const now = getNow();
		const secondsUntilNextMinute = 60 - now.getSeconds();

		let intervalId: NodeJS.Timeout | null = null;

		// Align to next full minute
		const initialTimeout = setTimeout(() => {
			setCurrentTime(getNow());

			// Start repeating interval
			intervalId = setInterval(() => {
				setCurrentTime(getNow());
			}, 60_000);
		}, secondsUntilNextMinute * 1000);

		return () => {
			clearTimeout(initialTimeout);
			if (intervalId) clearInterval(intervalId);
		};
	}, []);

	return currentTime;
}
