import mergeOriginal, { type Options } from 'deepmerge';
import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef } from 'react';
import { storage, syncFromChrome } from '@/lib/storage';
import { deepEqual } from '@/lib/utils';
import type { Student } from '@/magister/types';

const studentsStorageKey = 'students';
const testserverDataVersionKey = 'testserverDataVersion';

export function mergeStudent<T>(target: T, source: Partial<T>, options?: Options): T {
	return mergeOriginal(target, source, { arrayMerge: (_, sourceArray) => sourceArray, ...options });
}

async function fetchTestserverDataVersion(): Promise<string | undefined> {
	if (!import.meta.env.DEV) return undefined;

	try {
		const res = await fetch('/api/data-version');
		if (!res.ok) return undefined;
		const data = (await res.json()) as { version: string };
		return data.version;
	} catch {
		return undefined;
	}
}

export function useStudentStorageSync(students: Student[], setStudents: Dispatch<SetStateAction<Student[]>>) {
	const isWritingStudentsToStorage = useRef(false);

	const loadStoredStudents = useCallback(async () => {
		const serverVersion = await fetchTestserverDataVersion();
		if (serverVersion) {
			const cachedVersion = await storage.session.get<string>(testserverDataVersionKey);
			if (cachedVersion !== serverVersion) {
				await storage.session.remove(studentsStorageKey);
				await storage.session.set(testserverDataVersionKey, serverVersion);
				return [];
			}
		}

		const arr = await storage.session.get<Student[]>(studentsStorageKey);
		return arr ?? [];
	}, []);

	useEffect(() => {
		if (students.length) {
			isWritingStudentsToStorage.current = true;
			void storage.session.set(studentsStorageKey, students).then(() => {
				setTimeout(() => {
					isWritingStudentsToStorage.current = false;
				}, 50);
			});
		}
	}, [students]);

	useEffect(() => {
		if (!chrome?.storage) return;

		const onSessionStudents = syncFromChrome<Student[]>('session', studentsStorageKey, (arr) => {
			if (isWritingStudentsToStorage.current) return;
			setStudents((prev) => {
				const updated = arr ?? [];
				return deepEqual(prev, updated) ? prev : updated;
			});
		});

		chrome.storage.onChanged.addListener(onSessionStudents);
		return () => chrome.storage.onChanged.removeListener(onSessionStudents);
	}, [setStudents]);

	return { loadStoredStudents };
}
