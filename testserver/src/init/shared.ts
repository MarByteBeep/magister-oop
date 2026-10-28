import { join } from 'node:path';
import { fakerNL as faker } from '@faker-js/faker';

export const DATA_DIR = join(import.meta.dir, '../../data');
export const ALL_PHOTOS_DIR = join(DATA_DIR, 'all_photos');

/** Builds `self` and (for ~95% of entities) `foto` links, downloading a random photo for the latter. */
export async function generateEntityLinks(id: number, selfHref: string) {
	const hasPhoto = Math.random() > 0.05;
	const photoHref = hasPhoto
		? await downloadEntityPhoto(id, faker.image.url({ width: 192, height: 192 }), `${selfHref}/foto`)
		: undefined;

	return {
		self: { href: selfHref },
		...(photoHref && { foto: { href: photoHref } }),
	};
}

async function downloadEntityPhoto(
	id: number,
	fakerImageUrl: string,
	photoApiPath: string,
): Promise<string | undefined> {
	const photoFileName = `${id}.jpg`;
	const photoFilePath = join(ALL_PHOTOS_DIR, photoFileName);

	try {
		const response = await fetch(fakerImageUrl);
		if (response.ok && response.body) {
			const imageBuffer = await response.arrayBuffer();
			await Bun.write(photoFilePath, imageBuffer);
			return photoApiPath;
		}
		console.warn(`Failed to download image for ID ${id} from ${fakerImageUrl}: ${response.statusText}`);
	} catch (error) {
		console.error(`Error downloading image for ID ${id}:`, error);
	}
	return undefined;
}
