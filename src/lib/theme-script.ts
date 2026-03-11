// This script runs before the React app loads to prevent a flash of unstyled content (FOUC)
// when the user prefers dark mode. It checks the system's color scheme preference and
// applies the 'dark' class to the document's root element if necessary.
(() => {
	const applyTheme = () => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		if (mediaQuery.matches) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	};

	// Apply theme immediately
	applyTheme();

	// Also listen for changes in system preference in case the user changes it while the page is open
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
})();
