import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir =
	typeof (import.meta as { dir?: string }).dir !== 'undefined'
		? (import.meta as { dir: string }).dir
		: path.dirname(fileURLToPath(import.meta.url));
const ALL_PHOTOS_DIR = path.join(dir, '../../../data/all_photos');

export async function GET(_req: Request, id: number): Promise<Response> {
	const photoFileName = `${id}.jpg`; // Assuming JPEG
	const photoFilePath = path.join(ALL_PHOTOS_DIR, photoFileName);

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
