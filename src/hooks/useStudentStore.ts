import { type Dispatch, type SetStateAction, useCallback, useEffect, useState } from 'react';
import { storage, syncFromChrome } from '@/lib/storage';
import { type StudentDataSnapshot, studentDataStore } from '@/lib/studentDataStore';
import {
	isWritingStudentDataToSession,
	queuePersistStudentDataToSession,
	STUDENT_DATA_STORAGE_KEY,
} from '@/lib/studentDataStorePersistence';
import type { Student } from '@/types/student.types';
import type { StudentWrite } from '@/types/studentStore.types';

export function useStudentStore(): [Student[], Dispatch<SetStateAction<StudentWrite[]>>] {
	const [students, setStudentsState] = useState<Student[]>(() => studentDataStore.getStudents());

	useEffect(() => studentDataStore.subscribe(() => setStudentsState(studentDataStore.getStudents())), []);

	useEffect(() => studentDataStore.subscribe(() => queuePersistStudentDataToSession()), []);

	useEffect(() => {
		if (!chrome?.storage) return;

		const onSessionStudentData = syncFromChrome<StudentDataSnapshot | undefined>(
			'session',
			STUDENT_DATA_STORAGE_KEY,
			(snapshot) => {
				if (isWritingStudentDataToSession()) return;
				if (!snapshot?.students.length) {
					studentDataStore.clear();
					return;
				}
				studentDataStore.importSnapshot(snapshot);
			},
		);

		chrome.storage.onChanged.addListener(onSessionStudentData);
		return () => chrome.storage.onChanged.removeListener(onSessionStudentData);
	}, []);

	const setStudents = useCallback<Dispatch<SetStateAction<StudentWrite[]>>>((action) => {
		studentDataStore.setStudents(action);
	}, []);

	return [students, setStudents];
}

export async function clearStudentStore(): Promise<void> {
	studentDataStore.clear();
	await storage.session.remove(STUDENT_DATA_STORAGE_KEY);
}
