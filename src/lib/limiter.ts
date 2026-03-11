export function createLimiter(maxConcurrent: number, cooldownMs: number) {
	const queue: (() => Promise<void>)[] = [];
	let activeWorkers = 0;

	const runWorker = async () => {
		if (queue.length === 0) {
			activeWorkers--;
			return;
		}

		const task = queue.shift();
		if (!task) {
			activeWorkers--;
			return;
		}

		try {
			await task();
		} finally {
			// Worker cooldown
			setTimeout(() => {
				runWorker();
			}, cooldownMs);
		}
	};

	return function limit<T>(task: () => Promise<T>): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			queue.push(() => task().then(resolve).catch(reject));

			if (activeWorkers < maxConcurrent) {
				activeWorkers++;
				runWorker();
			}
		});
	};
}
