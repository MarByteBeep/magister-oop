// Helper function to normalize strings for diacritic-insensitive search
export function normalizeString(str: string) {
	return str
		.normalize('NFD') // Normalize to NFD form (decomposed characters)
		.replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
		.toLowerCase();
}
