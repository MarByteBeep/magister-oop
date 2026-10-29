import { sleep } from './sleep';

function isPaginationParam(key: string): boolean {
	return key === 'top' || key === 'skip';
}

function getPreservedQueryParams(searchParams: URLSearchParams) {
	const preserved = new URLSearchParams();
	for (const [key, value] of searchParams.entries()) {
		if (isPaginationParam(key)) continue;
		preserved.append(key, value);
	}
	return preserved.toString();
}

function buildPageHref(serverUrl: string, baseUrl: string, top: number, query: string, skip?: number) {
	const skipPart = skip === undefined ? '' : `&skip=${skip}`;
	const queryPart = query ? `&${query}` : '';
	return `${serverUrl}${baseUrl}?top=${top}${queryPart}${skipPart}`;
}

function assignPrevLink(
	links: Record<string, { href: string } | null>,
	serverUrl: string,
	baseUrl: string,
	top: number,
	skip: number,
	query: string,
) {
	if (skip <= 0) return;
	links.prev = {
		href: buildPageHref(serverUrl, baseUrl, top, query, Math.max(0, skip - top)),
	};
}

function assignNextLink(
	links: Record<string, { href: string } | null>,
	serverUrl: string,
	baseUrl: string,
	top: number,
	skip: number,
	totalCount: number,
	query: string,
) {
	if (skip + top >= totalCount) return;
	links.next = {
		href: buildPageHref(serverUrl, baseUrl, top, query, skip + top),
	};
}

function lastPageSkip(totalCount: number, top: number): number {
	const remainder = totalCount % top;
	if (remainder === 0) return Math.max(0, totalCount - top);
	return Math.max(0, totalCount - remainder);
}

function assignLastLink(
	links: Record<string, { href: string } | null>,
	serverUrl: string,
	baseUrl: string,
	top: number,
	totalCount: number,
	query: string,
) {
	if (totalCount <= 0) return;
	links.last = {
		href: buildPageHref(serverUrl, baseUrl, top, query, lastPageSkip(totalCount, top)),
	};
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
	assignPrevLink(links, serverUrl, baseUrl, top, skip, query);
	assignNextLink(links, serverUrl, baseUrl, top, skip, totalCount, query);
	assignLastLink(links, serverUrl, baseUrl, top, totalCount, query);
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
