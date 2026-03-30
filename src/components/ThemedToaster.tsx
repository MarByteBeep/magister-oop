'use client';

import { useLayoutEffect, useState } from 'react';
import { Toaster } from 'sonner';

function readResolvedTheme(): 'light' | 'dark' {
	if (typeof document === 'undefined') return 'light';
	return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function ThemedToaster() {
	const [resolved, setResolved] = useState<'light' | 'dark'>(readResolvedTheme);

	useLayoutEffect(() => {
		setResolved(readResolvedTheme());
		const el = document.documentElement;
		const observer = new MutationObserver(() => {
			setResolved(readResolvedTheme());
		});
		observer.observe(el, { attributes: true, attributeFilter: ['class'] });
		return () => observer.disconnect();
	}, []);

	return <Toaster theme={resolved} />;
}
