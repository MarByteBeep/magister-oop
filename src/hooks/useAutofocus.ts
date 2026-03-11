import { useEffect, useRef } from 'react';

export function useAutoFocus<T extends HTMLElement>() {
	const ref = useRef<T>(null);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		// Focus immediately if element is already visible
		const focusElement = () => {
			// Small delay to ensure any tab transition is complete
			setTimeout(() => {
				element.focus();
			}, 100);
		};

		// Use IntersectionObserver to detect when element becomes visible
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						focusElement();
					}
				});
			},
			{ threshold: 0.1 },
		);

		observer.observe(element);

		// Also try to focus immediately (in case element is already visible)
		focusElement();

		return () => {
			observer.disconnect();
		};
	}, []);

	return ref;
}
