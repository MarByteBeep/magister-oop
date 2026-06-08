'use client';

import { useEffect, useRef, useState } from 'react';
import { getOrCreateBlobUrl } from '@/lib/blobUtils';

export function useLazyBlobUrl<T extends HTMLElement>(src?: string) {
	const [isVisible, setIsVisible] = useState(false);
	const [blobUrl, setBlobUrl] = useState<string | undefined>();
	const elementRef = useRef<T | null>(null);

	useEffect(() => {
		if (!elementRef.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					setIsVisible(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.1 },
		);

		observer.observe(elementRef.current);

		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const currentSrc = src;
		if (!currentSrc) {
			setBlobUrl(undefined);
			return;
		}

		if (!isVisible) return;

		let cancelled = false;

		getOrCreateBlobUrl(currentSrc)
			.then((url) => {
				if (!cancelled) {
					setBlobUrl(url);
				}
			})
			.catch((err) => {
				console.error('Error loading avatar blob', err);
				if (!cancelled) {
					setBlobUrl(undefined);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [src, isVisible]);

	return { blobUrl, elementRef };
}
