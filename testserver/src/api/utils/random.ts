export function pickRandom<T>(arr: T[]): T {
	if (arr.length === 0) {
		throw new Error('pickRandom should have at least 1 element');
	}
	const index = Math.floor(Math.random() * arr.length);
	return arr[index];
}
