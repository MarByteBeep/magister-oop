import packageJson from '../../package.json';

function normalizeRepositoryUrl(raw: string): string {
	return raw
		.replace(/^git\+/, '')
		.replace(/^git@github\.com:/i, 'https://github.com/')
		.replace(/\.git$/i, '');
}

function repositoryBaseUrl(): string {
	const repo = packageJson.repository;
	if (typeof repo === 'string') {
		return normalizeRepositoryUrl(repo);
	}
	if (repo && typeof repo === 'object' && 'url' in repo) {
		const url = (repo as { url: unknown }).url;
		if (typeof url === 'string') {
			return normalizeRepositoryUrl(url);
		}
	}
	throw new Error('package.json: "repository" must be a string or an object with a string "url"');
}

const repositoryUrl = repositoryBaseUrl();

function readLicenseUrl(): string {
	const v = (packageJson as Record<string, unknown>).licenseUrl;
	if (typeof v === 'string' && v.trim().length > 0) {
		return v.trim();
	}
	throw new Error('package.json: "licenseUrl" must be a non-empty string');
}

export const appPackage = {
	version: packageJson.version,
	author: packageJson.author,
	license: packageJson.license,
	copyright: packageJson.copyright,
	repositoryUrl,
	licenseUrl: readLicenseUrl(),
	issuesUrl: `${repositoryUrl}/issues`,
};
