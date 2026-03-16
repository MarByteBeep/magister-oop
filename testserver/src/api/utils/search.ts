import { sleep } from './sleep';

export async function search<T>(req: Request, baseUrl: string, allItems: T[]) {
	const url = new URL(req.url);
	const searchParams = url.searchParams;
	const serverUrl = url.origin;

	await sleep(500);

	const defaultTop = 20;
	const top = parseInt(searchParams.get('top') || defaultTop.toString(), 10);
	const skip = parseInt(searchParams.get('skip') || '0', 10);

	const totalCount = allItems.length;

	const items = allItems.slice(skip, skip + top);

	// Dynamically build query parameters, excluding 'top' and 'skip'
	const preservedSearchParams = new URLSearchParams();
	for (const [key, value] of searchParams.entries()) {
		if (key !== 'top' && key !== 'skip') {
			preservedSearchParams.append(key, value);
		}
	}
	const dynamicQParam = preservedSearchParams.toString();

	const links: Record<string, { href: string } | null> = {
		first: { href: `${serverUrl}/${baseUrl}?top=${top}${dynamicQParam ? `&${dynamicQParam}` : ''}` },
		prev: null,
		next: null,
		last: null,
	};

	// Calculate prev link
	if (skip > 0) {
		const prevSkip = Math.max(0, skip - top);
		links.prev = {
			href: `${serverUrl}${baseUrl}?top=${top}${dynamicQParam ? `&${dynamicQParam}` : ''}&skip=${prevSkip}`,
		};
	}

	// Calculate next link
	if (skip + top < totalCount) {
		const nextSkip = skip + top;
		links.next = {
			href: `${serverUrl}${baseUrl}?top=${top}${dynamicQParam ? `&${dynamicQParam}` : ''}&skip=${nextSkip}`,
		};
	}

	// Calculate last link
	if (totalCount > 0) {
		const lastSkip = Math.max(0, totalCount - (totalCount % top === 0 ? top : totalCount % top));
		links.last = {
			href: `${serverUrl}${baseUrl}?top=${top}${dynamicQParam ? `&${dynamicQParam}` : ''}&skip=${lastSkip}`,
		};
	}

	const responseBody = {
		items: items,
		links: links,
		totalCount: totalCount,
	};

	return new Response(JSON.stringify(responseBody), {
		headers: { 'Content-Type': 'application/json' },
	});
}
