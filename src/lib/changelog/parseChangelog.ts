export interface ChangelogSection {
	version: string;
	date?: string;
	items: string[];
}

const SECTION_HEADING = /^##\s+(.+)$/;
const BULLET_LINE = /^-\s+(.+)$/;

function sectionFromHeading(heading: string): ChangelogSection | null {
	const [version, date] = heading.split('—').map((part) => part.trim());
	if (!version) return null;
	return { version, date, items: [] };
}

function parseSectionHeading(line: string): ChangelogSection | null {
	const match = SECTION_HEADING.exec(line.trim());
	const heading = match?.[1];
	if (!heading) return null;
	return sectionFromHeading(heading);
}

function parseBulletItem(line: string): string | null {
	const match = BULLET_LINE.exec(line.trim());
	if (!match?.[1]) return null;
	return match[1];
}

function appendBulletIfPresent(line: string, current: ChangelogSection): void {
	const item = parseBulletItem(line);
	if (item) current.items.push(item);
}

function processChangelogLine(
	line: string,
	current: ChangelogSection | null,
	sections: ChangelogSection[],
): ChangelogSection | null {
	const section = parseSectionHeading(line);
	if (section) {
		sections.push(section);
		return section;
	}
	if (!current) return current;
	appendBulletIfPresent(line, current);
	return current;
}

export function parseChangelog(markdown: string): ChangelogSection[] {
	const sections: ChangelogSection[] = [];
	let current: ChangelogSection | null = null;

	for (const line of markdown.split('\n')) {
		current = processChangelogLine(line, current, sections);
	}

	return sections;
}
