import { type RefObject, useLayoutEffect, useState } from 'react';

/**
 * Number of whole text lines that fit inside an element. Clamping to this count keeps
 * the last visible line complete and lets the browser add an ellipsis instead of
 * cutting a line in half.
 */
export function useFittingLineCount(ref: RefObject<HTMLElement | null>): number {
	const [lineCount, setLineCount] = useState(1);

	useLayoutEffect(() => {
		const element = ref.current;
		if (!element) return;

		const measure = () => {
			const styles = getComputedStyle(element);
			const lineHeight = Number.parseFloat(styles.lineHeight);
			if (!Number.isFinite(lineHeight) || lineHeight <= 0) return;

			const padding = Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
			const available = element.clientHeight - padding;
			setLineCount(Math.max(1, Math.floor(available / lineHeight)));
		};

		measure();

		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, [ref]);

	return lineCount;
}
