import packageJson from '../../../package.json';

function normalizeRepositoryUrl(raw: string): string {
	return raw
		.replace(/^git\+/, '')
		.replace(/^git@github\.com:/i, 'https://github.com/')
		.replace(/\.git$/i, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function repositoryUrlFromString(repository: unknown): string | null {
	if (typeof repository !== 'string') return null;
	return normalizeRepositoryUrl(repository);
}

function repositoryUrlFromObject(repository: unknown): string | null {
	if (!isRecord(repository)) return null;
	const url = repository.url;
	if (typeof url !== 'string') return null;
	return normalizeRepositoryUrl(url);
}

function repositoryBaseUrl(repository: unknown): string {
	const fromString = repositoryUrlFromString(repository);
	if (fromString !== null) return fromString;
	const fromObject = repositoryUrlFromObject(repository);
	if (fromObject !== null) return fromObject;
	throw new Error('package.json: "repository" must be a string or an object with a string "url"');
}

function readLicenseUrl(pkg: Record<string, unknown>): string {
	const value = pkg.licenseUrl;
	if (typeof value !== 'string') {
		throw new Error('package.json: "licenseUrl" must be a non-empty string');
	}
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		throw new Error('package.json: "licenseUrl" must be a non-empty string');
	}
	return trimmed;
}

const repositoryUrl = repositoryBaseUrl(packageJson.repository);

export const appPackage = {
	version: packageJson.version,
	author: packageJson.author,
	license: packageJson.license,
	copyright: packageJson.copyright,
	repositoryUrl,
	licenseUrl: readLicenseUrl(packageJson as Record<string, unknown>),
	issuesUrl: `${repositoryUrl}/issues`,
};
