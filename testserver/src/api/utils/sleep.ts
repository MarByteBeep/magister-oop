/** Sleep in ms. Works in both Node and Bun (replaces Bun.sleepSync). */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
