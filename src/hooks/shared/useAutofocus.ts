import { useEffect, useRef } from 'react';

export function useAutoFocus<T extends HTMLElement>(enabled = true) {
	const ref = useRef<T>(null);

	useEffect(() => {
		if (!enabled) return;

		const element = ref.current;
		if (!element) return;

		const focusElement = () => {
			requestAnimationFrame(() => {
				element.focus();
			});
		};

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) focusElement();
				}
			},
			{ threshold: 0.1 },
		);

		observer.observe(element);
		focusElement();

		return () => {
			observer.disconnect();
		};
	}, [enabled]);

	return ref;
}
