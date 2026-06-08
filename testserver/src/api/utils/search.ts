import { sleep } from './sleep';

function getPreservedQueryParams(searchParams: URLSearchParams) {
	const preserved = new URLSearchParams();
	for (const [key, value] of searchParams.entries()) {
		if (key !== 'top' && key !== 'skip') {
			preserved.append(key, value);
		}
	}
	return preserved.toString();
}

function buildPageHref(serverUrl: string, baseUrl: string, top: number, query: string, skip?: number) {
	const skipPart = skip === undefined ? '' : `&skip=${skip}`;
	const queryPart = query ? `&${query}` : '';
	return `${serverUrl}${baseUrl}?top=${top}${queryPart}${skipPart}`;
}

function buildPaginationLinks(
	serverUrl: string,
	baseUrl: string,
	top: number,
	skip: number,
	totalCount: number,
	query: string,
) {
	const links: Record<string, { href: string } | null> = {
		first: { href: buildPageHref(serverUrl, baseUrl, top, query) },
		prev: null,
		next: null,
		last: null,
	};

	if (skip > 0) {
		links.prev = { href: buildPageHref(serverUrl, baseUrl, top, query, Math.max(0, skip - top)) };
	}

	if (skip + top < totalCount) {
		links.next = { href: buildPageHref(serverUrl, baseUrl, top, query, skip + top) };
	}

	if (totalCount > 0) {
		const remainder = totalCount % top;
		const lastSkip = Math.max(0, totalCount - (remainder === 0 ? top : remainder));
		links.last = { href: buildPageHref(serverUrl, baseUrl, top, query, lastSkip) };
	}

	return links;
}

export async function search<T>(req: Request, baseUrl: string, allItems: T[]) {
	const url = new URL(req.url);
	const searchParams = url.searchParams;
	const serverUrl = url.origin;

	await sleep(500);

	const top = parseInt(searchParams.get('top') || '20', 10);
	const skip = parseInt(searchParams.get('skip') || '0', 10);
	const totalCount = allItems.length;
	const items = allItems.slice(skip, skip + top);
	const query = getPreservedQueryParams(searchParams);
	const links = buildPaginationLinks(serverUrl, baseUrl, top, skip, totalCount, query);

	return new Response(
		JSON.stringify({
			items,
			links,
			totalCount,
		}),
		{
			headers: { 'Content-Type': 'application/json' },
		},
	);
}
