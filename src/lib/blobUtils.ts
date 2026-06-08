'use client';

import { getBlob } from '@/magister/api';

// Cache for object URLs created from blobs
const objectUrlCache = new Map<string, string>();

/**
 * Fetches a blob and creates an object URL for it, caching the result.
 * If the blob URL is already in the cache, it returns the cached URL.
 *
 * @param href The URL of the blob to fetch.
 * @returns A Promise that resolves to the object URL.
 */
export async function getOrCreateBlobUrl(href: string): Promise<string> {
	if (objectUrlCache.has(href)) {
		return objectUrlCache.get(href) as string;
	}

	try {
		const blob = await getBlob(href);
		const objectUrl = URL.createObjectURL(blob);
		objectUrlCache.set(href, objectUrl);
		return objectUrl;
	} catch (error) {
		console.error(`Error getting or creating blob URL for ${href}:`, error);
		throw error;
	}
}
