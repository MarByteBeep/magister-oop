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

/**
 * Revokes a specific object URL from the cache and the browser.
 * Note: This should only be called when you are certain no other component
 * is using this object URL. For simplicity, in this context, we might
 * let the cache grow or implement a global cleanup on extension close.
 * @param href The original URL (key in cache) for which to revoke the object URL.
 */
export function revokeBlobUrl(href: string) {
	const objectUrl = objectUrlCache.get(href);
	if (objectUrl) {
		URL.revokeObjectURL(objectUrl);
		objectUrlCache.delete(href);
	}
}

/**
 * Revokes all cached object URLs.
 * This could be called when the extension popup is closed to free up memory.
 */
export function revokeAllBlobUrls() {
	for (const objectUrl of objectUrlCache.values()) {
		URL.revokeObjectURL(objectUrl);
	}
	objectUrlCache.clear();
}
