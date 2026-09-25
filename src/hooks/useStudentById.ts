import { useSyncExternalStore } from 'react';
import { studentDataStore } from '@/lib/studentDataStore';
import type { Student } from '@/types/student.types';

const subscribeByStudentId = new Map<number, (onStoreChange: () => void) => () => void>();
const snapshotByStudentId = new Map<number, () => Student | undefined>();

function getStudentSubscribe(studentId: number): (onStoreChange: () => void) => () => void {
	let subscribe = subscribeByStudentId.get(studentId);
	if (!subscribe) {
		subscribe = (onStoreChange) => studentDataStore.subscribeStudent(studentId, onStoreChange);
		subscribeByStudentId.set(studentId, subscribe);
	}
	return subscribe;
}

function getStudentSnapshot(studentId: number): () => Student | undefined {
	let snapshot = snapshotByStudentId.get(studentId);
	if (!snapshot) {
		snapshot = () => studentDataStore.getStudent(studentId);
		snapshotByStudentId.set(studentId, snapshot);
	}
	return snapshot;
}

export function useStudentById(studentId: number): Student | undefined {
	return useSyncExternalStore(
		getStudentSubscribe(studentId),
		getStudentSnapshot(studentId),
		getStudentSnapshot(studentId),
	);
}
