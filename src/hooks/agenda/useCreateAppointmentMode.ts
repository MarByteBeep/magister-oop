import { useEffect, useState } from 'react';

/** True while Control is held and appointment creation is available. */
export function useCreateAppointmentMode(enabled: boolean): boolean {
	const [active, setActive] = useState(false);

	useEffect(() => {
		if (!enabled) return;

		const activate = (event: KeyboardEvent) => {
			if (event.key !== 'Control') return;
			// react-big-calendar ends a drag on any keydown. Holding Control repeats
			// that event and collapses a multi-hour drag into a click.
			event.stopPropagation();
			if (event.repeat) return;
			setActive(true);
		};

		const deactivate = (event: KeyboardEvent) => {
			if (event.key !== 'Control') return;
			event.stopPropagation();
			setActive(false);
		};

		const clear = () => setActive(false);

		const clearWhenHidden = () => {
			if (document.hidden) setActive(false);
		};

		window.addEventListener('keydown', activate, true);
		window.addEventListener('keyup', deactivate, true);
		window.addEventListener('blur', clear);
		document.addEventListener('visibilitychange', clearWhenHidden);

		return () => {
			window.removeEventListener('keydown', activate, true);
			window.removeEventListener('keyup', deactivate, true);
			window.removeEventListener('blur', clear);
			document.removeEventListener('visibilitychange', clearWhenHidden);
			setActive(false);
		};
	}, [enabled]);

	return enabled && active;
}
