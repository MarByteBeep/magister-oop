type StorageType = 'session' | 'local';

interface StorageAPI {
	get<T>(key: string): Promise<T | undefined>;
	set<T>(key: string, value: T): Promise<void>;
	remove(key: string): Promise<void>;
	size(): number;
}

function isChromeStorageAvailable() {
	return typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined';
}

function getChromeArea(type: StorageType) {
	if (!isChromeStorageAvailable()) return undefined;

	return type === 'session' ? chrome.storage.session : chrome.storage.local;
}

function createStorage(type: StorageType): StorageAPI {
	const chromeArea = getChromeArea(type);
	const browserArea = type === 'session' ? sessionStorage : localStorage;

	const sizeMap = new Map<string, number>();

	async function get<T>(key: string): Promise<T | undefined> {
		if (chromeArea) {
			const result = await chromeArea.get(key);
			return result[key] as T | undefined;
		}

		const raw = browserArea.getItem(key);
		if (!raw) return undefined;

		try {
			return JSON.parse(raw) as T;
		} catch (e) {
			console.warn(`[storage.get] JSON parse error for '${key}'`, e);
			return undefined;
		}
	}

	async function set<T>(key: string, value: T): Promise<void> {
		const json = JSON.stringify(value);
		const size = json.length;
		sizeMap.set(key, size);

		console.info(
			`[${type.toUpperCase()} STORED '${key}'] ${(size / (1024 * 1024)).toPrecision(2)} MB ` +
				`\ttotal: ${(api.size() / (1024 * 1024)).toPrecision(2)} MB`,
		);

		try {
			if (chromeArea) {
				await chromeArea.set({ [key]: value });
			} else {
				browserArea.setItem(key, json);
			}
		} catch (err) {
			if (err instanceof Error && err.message.includes('quota')) {
				// Re-throw with a more specific error that can be caught
				const quotaError = new Error('Session storage quota bytes exceeded. Values were not stored.');
				quotaError.name = 'StorageQuotaExceededError';
				throw quotaError;
			}
			throw err;
		}
	}

	async function remove(key: string) {
		sizeMap.delete(key);

		if (chromeArea) {
			await chromeArea.remove(key);
		} else {
			browserArea.removeItem(key);
		}
	}

	function size() {
		let total = 0;
		for (const s of sizeMap.values()) total += s;
		return total;
	}

	const api: StorageAPI = { get, set, remove, size };
	return api;
}

export const storage = {
	session: createStorage('session'),
	local: createStorage('local'),
};

export function syncFromChrome<T>(type: StorageType, key: string, handler: (value: T) => void) {
	return (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
		if (area !== type) return;
		if (!changes[key]) return;

		handler(changes[key].newValue as T);
	};
}
