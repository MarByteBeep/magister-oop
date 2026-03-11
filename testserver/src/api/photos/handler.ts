import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Path to the directory where all photos are stored
const ALL_PHOTOS_DIR = join(import.meta.dir, '../../../data/all_photos');

export async function GET(_req: Request, id: number): Promise<Response> {
	const photoFileName = `${id}.jpg`; // Assuming JPEG
	const photoFilePath = join(ALL_PHOTOS_DIR, photoFileName);

	if (!existsSync(photoFilePath)) {
		console.warn(`Photo not found for ID ${id} at ${photoFilePath}`);
		return new Response('Photo not found', { status: 404 });
	}

	try {
		const imageBuffer = readFileSync(photoFilePath);
		const contentType = 'image/jpeg'; // Assuming JPEG
		console.log(`Serving photo for ID ${id} from ${photoFilePath}`);

		return new Response(imageBuffer, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000', // Cache for a year
			},
		});
	} catch (error) {
		console.error(`Error serving photo for ID ${id}:`, error);
		return new Response('Internal Server Error', { status: 500 });
	}
}
