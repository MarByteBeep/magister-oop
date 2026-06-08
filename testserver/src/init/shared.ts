import { join } from 'node:path';

export const DATA_DIR = join(import.meta.dir, '../../data');
export const ALL_PHOTOS_DIR = join(DATA_DIR, 'all_photos');

export async function downloadEntityPhoto(
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
