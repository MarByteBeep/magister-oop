import { useEffect, useState } from 'react';

export function useChartDarkMode() {
	const [chartIsDark, setChartIsDark] = useState(
		() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
	);

	useEffect(() => {
		const root = document.documentElement;
		const sync = () => setChartIsDark(root.classList.contains('dark'));
		sync();
		const observer = new MutationObserver(sync);
		observer.observe(root, { attributes: true, attributeFilter: ['class'] });
		return () => observer.disconnect();
	}, []);

	return chartIsDark;
}
