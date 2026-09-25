import { storage } from '@/lib/storage';
import { type StudentDataSnapshot, studentDataStore } from '@/lib/studentDataStore';

export const STUDENT_DATA_STORAGE_KEY = 'studentData';
const PERSIST_DEBOUNCE_MS = 300;

let persistQueue: Promise<void> = Promise.resolve();
let persistTimeout: ReturnType<typeof setTimeout> | null = null;
let isWritingToSession = false;
let sessionHydrationComplete = false;

export function isWritingStudentDataToSession(): boolean {
	return isWritingToSession;
}

/** Restore normalized student data from chrome.storage.session (survives popup close). */
export async function loadStudentDataFromSession(): Promise<void> {
	try {
		const snapshot = await storage.session.get<StudentDataSnapshot>(STUDENT_DATA_STORAGE_KEY);
		if (!snapshot?.students.length) return;

		studentDataStore.importSnapshot(snapshot);
	} finally {
		sessionHydrationComplete = true;
	}
}

export async function clearStudentDataFromSession(): Promise<void> {
	await storage.session.remove(STUDENT_DATA_STORAGE_KEY);
}

async function writeSnapshotToSession(): Promise<void> {
	const snapshot = studentDataStore.exportSnapshot();
	isWritingToSession = true;
	try {
		if (snapshot.students.length === 0) {
			await clearStudentDataFromSession();
			return;
		}

		await storage.session.set(STUDENT_DATA_STORAGE_KEY, snapshot);
	} finally {
		setTimeout(() => {
			isWritingToSession = false;
		}, 50);
	}
}

/** Persist the normalized snapshot after in-memory updates (debounced). */
export function queuePersistStudentDataToSession(): void {
	if (!sessionHydrationComplete) return;

	if (persistTimeout) clearTimeout(persistTimeout);
	persistTimeout = setTimeout(() => {
		persistTimeout = null;
		persistQueue = persistQueue
			.then(() => writeSnapshotToSession())
			.catch((error) => {
				console.error('Failed to persist student data to session storage', error);
			});
	}, PERSIST_DEBOUNCE_MS);
}
