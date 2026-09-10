/** Avatar fallback: first letters of the first two name parts. */
export function getInitials(name: string) {
	return name
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part.charAt(0))
		.join('')
		.toUpperCase();
}

/** Dutch display name: "Ada de Boyer", collapsing a missing infix. */
export function formatPersonName(firstName: string, infix: string | null | undefined, lastName: string) {
	return `${firstName} ${infix ?? ''} ${lastName}`.replace(/\s+/g, ' ').trim();
}

// Helper function to normalize strings for diacritic-insensitive search
export function normalizeString(str: string) {
	return str
		.normalize('NFD') // Normalize to NFD form (decomposed characters)
		.replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
		.toLowerCase();
}
