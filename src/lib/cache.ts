import LZString from 'lz-string';
import { storage } from './storage';

const STORAGE_KEY = 'jsonCache';

// ---- Switch compression on/off here ----
const USE_COMPRESSION = true;

const jsonCache = new Map<string, unknown>();

export async function loadJsonCache() {
	if (USE_COMPRESSION) {
		const storedCompressed = await storage.session.get<Record<string, string>>(STORAGE_KEY);
		if (storedCompressed) {
			for (const [k, compressed] of Object.entries(storedCompressed)) {
				try {
					const jsonStr = LZString.decompress(compressed);
					if (jsonStr) {
						jsonCache.set(k, JSON.parse(jsonStr));
					}
				} catch (e) {
					console.warn(`Failed to decompress JSON cache for key "${k}"`, e);
				}
			}
		}
		console.info('Loaded JSON cache from session storage (compressed)');
		return;
	}

	const stored = await storage.session.get<Record<string, unknown>>(STORAGE_KEY);
	if (stored) {
		for (const [k, v] of Object.entries(stored)) {
			jsonCache.set(k, v);
		}
	}
	console.info('Loaded JSON cache from session storage (uncompressed)');
}

async function storeJsonCache() {
	if (USE_COMPRESSION) {
		const obj: Record<string, string> = {};
		for (const [k, v] of jsonCache.entries()) {
			try {
				const jsonStr = JSON.stringify(v);
				const compressed = LZString.compress(jsonStr);
				obj[k] = compressed;
			} catch (e) {
				console.warn(`Failed to compress JSON cache for key "${k}"`, e);
			}
		}
		await storage.session.set(STORAGE_KEY, obj);
		return;
	}

	const obj: Record<string, unknown> = Object.fromEntries(jsonCache.entries());
	await storage.session.set(STORAGE_KEY, obj);
}

export async function jsonCacheSet(key: string, value: unknown) {
	jsonCache.set(key, value);
	await storeJsonCache();
}

export function jsonCacheGet<T>(key: string): T | undefined {
	return jsonCache.get(key) as T | undefined;
}
