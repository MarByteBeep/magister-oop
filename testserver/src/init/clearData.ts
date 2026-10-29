import { existsSync, mkdirSync, rmSync } from 'node:fs';
import {
	ABSENCE_NOTICES_FILE_PATH,
	AGENDA_FILE_PATH,
	ALL_PHOTOS_DIR,
	LOCKERS_FILE_PATH,
	RETURN_MEASURES_FILE_PATH,
	STAFF_MEMBERS_FILE_PATH,
	STUDENTS_FILE_PATH,
} from './paths';

function removeFileIfExists(filePath: string): boolean {
	if (!existsSync(filePath)) return false;
	rmSync(filePath);
	return true;
}

function removeDirIfExists(dirPath: string): boolean {
	if (!existsSync(dirPath)) return false;
	rmSync(dirPath, { recursive: true, force: true });
	return true;
}

function removeAndLog(path: string, remove: (path: string) => boolean): void {
	if (remove(path)) console.log(`Removed ${path}`);
}

export function clearExistingData(): void {
	console.log('Clearing existing data...');
	for (const filePath of [
		STAFF_MEMBERS_FILE_PATH,
		STUDENTS_FILE_PATH,
		LOCKERS_FILE_PATH,
		AGENDA_FILE_PATH,
		RETURN_MEASURES_FILE_PATH,
		ABSENCE_NOTICES_FILE_PATH,
	]) {
		removeAndLog(filePath, removeFileIfExists);
	}
	removeAndLog(ALL_PHOTOS_DIR, removeDirIfExists);
	mkdirSync(ALL_PHOTOS_DIR, { recursive: true });
	console.log(`Created directory: ${ALL_PHOTOS_DIR}`);
}
