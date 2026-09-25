import type { SetStateAction } from 'react';
import type { AbsenceNoticeLoadDayState } from '@/lib/absenceNoticeLoadState';
import { deepEqual } from '@/lib/utils';
import type {
	AgendaItem,
	AgendaParticipant,
	AttendanceGroup,
	AttendanceStaffMember,
	Participant,
} from '@/magister/response/agenda.types';
import type { AgendaEntry, LessonAgendaEntry } from '@/magister/response/agenda-entry.types';
import type { Student } from '@/types/student.types';
import type { StudentWrite } from '@/types/studentStore.types';

type ParticipantRef = { type: 'medewerker'; id: number } | { type: 'groep'; id: number };

type StoredAgendaItem = Omit<AgendaItem, 'deelnames'> & {
	deelnames: ParticipantRef[];
};

type StoredLessonEntry = {
	kind: 'lesson';
	start: string;
	end: string;
	itemId: number;
};

type StoredAgendaEntry = StoredLessonEntry | Exclude<AgendaEntry, LessonAgendaEntry>;

type StudentRecord = Omit<StudentWrite, 'agenda' | 'absenceNoticeLoad'>;

export type StudentAgendaSnapshot = {
	studentId: number;
	agenda: Record<string, StoredAgendaEntry[]>;
};

export type AbsenceNoticeLoadSnapshot = {
	studentId: number;
	days: Record<string, AbsenceNoticeLoadDayState>;
};

/** Normalized in-memory shape; safe to persist in chrome.storage.session. */
export type StudentDataSnapshot = {
	students: StudentRecord[];
	agendaItems: StoredAgendaItem[];
	staffMembers: Array<Omit<AttendanceStaffMember, 'links'>>;
	groups: Array<Omit<AttendanceGroup, 'links'>>;
	studentAgenda: StudentAgendaSnapshot[];
	absenceNoticeLoad: AbsenceNoticeLoadSnapshot[];
};

type ReferencedInternedIds = {
	agendaItemIds: Set<number>;
	staffMemberIds: Set<number>;
	groupIds: Set<number>;
};

class StudentDataStore {
	private students = new Map<number, StudentRecord>();
	private agendaItems = new Map<number, StoredAgendaItem>();
	private staffMembers = new Map<number, Omit<AttendanceStaffMember, 'links'>>();
	private groups = new Map<number, Omit<AttendanceGroup, 'links'>>();
	private studentAgenda = new Map<number, Record<string, StoredAgendaEntry[]>>();
	private absenceNoticeLoad = new Map<number, Record<string, AbsenceNoticeLoadDayState>>();
	private hydratedStudents = new Map<number, Student>();
	private lastStudentsArray: Student[] | null = null;
	private listeners = new Set<() => void>();
	private studentListeners = new Map<number, Set<() => void>>();
	private changedStudentIds = new Set<number>();

	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	subscribeStudent(studentId: number, listener: () => void): () => void {
		let listeners = this.studentListeners.get(studentId);
		if (!listeners) {
			listeners = new Set();
			this.studentListeners.set(studentId, listeners);
		}
		listeners.add(listener);
		return () => {
			listeners?.delete(listener);
			if (listeners?.size === 0) {
				this.studentListeners.delete(studentId);
			}
		};
	}

	clear(): void {
		this.replaceFromSnapshot(emptySnapshot());
		this.emitAll();
	}

	exportSnapshot(): StudentDataSnapshot {
		const referencedIds = this.collectReferencedIds();
		this.pruneInternedEntities(referencedIds);
		return this.buildSnapshot(referencedIds);
	}

	importSnapshot(snapshot: StudentDataSnapshot): void {
		if (deepEqual(snapshot, this.buildSnapshot())) return;
		this.replaceFromSnapshot(snapshot);
		this.emitAll();
	}

	private buildSnapshot(referencedIds?: ReferencedInternedIds): StudentDataSnapshot {
		const { agendaItemIds, staffMemberIds, groupIds } = referencedIds ?? this.collectReferencedIds();

		return {
			students: [...this.students.values()],
			agendaItems: [...agendaItemIds]
				.map((id) => this.agendaItems.get(id))
				.filter((item): item is StoredAgendaItem => item !== undefined),
			staffMembers: [...staffMemberIds]
				.map((id) => this.staffMembers.get(id))
				.filter((member): member is Omit<AttendanceStaffMember, 'links'> => member !== undefined),
			groups: [...groupIds]
				.map((id) => this.groups.get(id))
				.filter((group): group is Omit<AttendanceGroup, 'links'> => group !== undefined),
			studentAgenda: [...this.studentAgenda.entries()].map(([studentId, agenda]) => ({
				studentId,
				agenda,
			})),
			absenceNoticeLoad: [...this.absenceNoticeLoad.entries()].map(([studentId, days]) => ({
				studentId,
				days,
			})),
		};
	}

	private replaceFromSnapshot(snapshot: StudentDataSnapshot): void {
		this.students.clear();
		this.agendaItems.clear();
		this.staffMembers.clear();
		this.groups.clear();
		this.studentAgenda.clear();
		this.absenceNoticeLoad.clear();
		this.hydratedStudents.clear();
		this.lastStudentsArray = null;

		for (const student of snapshot.students) {
			this.students.set(student.id, student);
		}

		for (const item of snapshot.agendaItems) {
			this.agendaItems.set(item.id, item);
		}

		for (const staffMember of snapshot.staffMembers) {
			this.staffMembers.set(staffMember.id, staffMember);
		}

		for (const group of snapshot.groups) {
			this.groups.set(group.id, group);
		}

		for (const { studentId, agenda } of snapshot.studentAgenda) {
			this.studentAgenda.set(studentId, agenda);
		}

		for (const { studentId, days } of snapshot.absenceNoticeLoad) {
			this.absenceNoticeLoad.set(studentId, days);
		}
	}

	setStudents(action: SetStateAction<StudentWrite[]>): void {
		const prev = this.getStudents();
		const next = typeof action === 'function' ? action(prev) : action;
		if (next === prev) return;
		if (this.applyHydratedStudents(prev, next)) {
			this.emit();
		}
	}

	getStudents(): Student[] {
		const next = [...this.students.keys()]
			.sort((a, b) => a - b)
			.flatMap((id) => {
				const student = this.getStudent(id);
				return student ? [student] : [];
			});

		if (
			this.lastStudentsArray &&
			this.lastStudentsArray.length === next.length &&
			this.lastStudentsArray.every((student, index) => student === next[index])
		) {
			return this.lastStudentsArray;
		}

		this.lastStudentsArray = next;
		return next;
	}

	getAbsenceNoticeLoad(id: number): Record<string, AbsenceNoticeLoadDayState> | undefined {
		return this.absenceNoticeLoad.get(id);
	}

	getStudent(id: number): Student | undefined {
		const cached = this.hydratedStudents.get(id);
		if (cached) return cached;

		const base = this.students.get(id);
		if (!base) return undefined;

		const storedAgenda = this.studentAgenda.get(id);
		const hydrated: Student = storedAgenda
			? { ...base, agenda: this.hydrateStoredAgenda(storedAgenda) }
			: { ...base };
		this.hydratedStudents.set(id, hydrated);
		return hydrated;
	}

	private hydrateStoredAgenda(storedAgenda: Record<string, StoredAgendaEntry[]>): Record<string, AgendaEntry[]> {
		return Object.fromEntries(
			Object.entries(storedAgenda).map(([dateKey, entries]) => [
				dateKey,
				entries.flatMap((entry) => {
					const hydrated = this.hydrateEntry(entry);
					return hydrated ? [hydrated] : [];
				}),
			]),
		);
	}

	private emit(): void {
		for (const listener of this.listeners) {
			listener();
		}
		this.emitChangedStudents();
	}

	private emitAll(): void {
		for (const listener of this.listeners) {
			listener();
		}
		for (const listeners of this.studentListeners.values()) {
			for (const listener of listeners) {
				listener();
			}
		}
		this.changedStudentIds.clear();
	}

	private emitChangedStudents(): void {
		if (this.changedStudentIds.size === 0) return;
		for (const studentId of this.changedStudentIds) {
			const listeners = this.studentListeners.get(studentId);
			if (!listeners) continue;
			for (const listener of listeners) {
				listener();
			}
		}
		this.changedStudentIds.clear();
	}

	private markStudentChanged(studentId: number): void {
		this.changedStudentIds.add(studentId);
	}

	private applyHydratedStudents(prev: Student[], students: StudentWrite[]): boolean {
		const prevById = new Map(prev.map((student) => [student.id, student]));
		const nextIds = new Set(students.map((student) => student.id));

		let changed = this.removeStaleStudentIds(nextIds);

		for (const student of students) {
			const prevStudent = prevById.get(student.id);
			if (prevStudent === student) continue;

			if (this.syncStudentWrite(student, prevStudent)) {
				this.markStudentChanged(student.id);
				changed = true;
			}
		}

		if (changed) {
			this.lastStudentsArray = null;
		}

		return changed;
	}

	private removeStaleStudentIds(nextIds: Set<number>): boolean {
		let changed = false;

		for (const id of this.students.keys()) {
			if (nextIds.has(id)) continue;
			this.students.delete(id);
			this.studentAgenda.delete(id);
			this.absenceNoticeLoad.delete(id);
			this.hydratedStudents.delete(id);
			this.markStudentChanged(id);
			changed = true;
		}

		return changed;
	}

	private syncStudentWrite(student: StudentWrite, prevStudent: Student | undefined): boolean {
		let changed = false;

		const { agenda, absenceNoticeLoad: absenceLoad, ...base } = student;

		if (!prevStudent || !deepEqual(this.students.get(student.id), base)) {
			this.students.set(student.id, base);
			this.hydratedStudents.delete(student.id);
			changed = true;
		}

		if (agenda !== undefined) {
			const normalized = this.normalizeAgenda(agenda);
			if (!deepEqual(this.studentAgenda.get(student.id), normalized)) {
				this.studentAgenda.set(student.id, normalized);
				// Drop cached student so getStudents() returns a new object with the updated agenda.
				this.hydratedStudents.delete(student.id);
				changed = true;
			}
		}

		if (absenceLoad !== undefined) {
			if (!deepEqual(this.absenceNoticeLoad.get(student.id), absenceLoad)) {
				this.absenceNoticeLoad.set(student.id, absenceLoad);
				// Same identity rule as agenda: consumers key on student reference, not absenceNoticeLoad.
				this.hydratedStudents.delete(student.id);
				changed = true;
			}
		}

		return changed;
	}

	private collectLessonItemIds(): Set<number> {
		const agendaItemIds = new Set<number>();

		for (const agenda of this.studentAgenda.values()) {
			for (const entries of Object.values(agenda)) {
				for (const entry of entries) {
					if (entry.kind !== 'lesson') continue;
					agendaItemIds.add(entry.itemId);
				}
			}
		}

		return agendaItemIds;
	}

	private collectParticipantIds(
		agendaItemIds: Set<number>,
	): Pick<ReferencedInternedIds, 'staffMemberIds' | 'groupIds'> {
		const staffMemberIds = new Set<number>();
		const groupIds = new Set<number>();

		for (const itemId of agendaItemIds) {
			const item = this.agendaItems.get(itemId);
			if (!item) continue;
			for (const ref of item.deelnames) {
				if (ref.type === 'medewerker') staffMemberIds.add(ref.id);
				else groupIds.add(ref.id);
			}
		}

		return { staffMemberIds, groupIds };
	}

	private collectReferencedIds(): ReferencedInternedIds {
		const agendaItemIds = this.collectLessonItemIds();
		return { agendaItemIds, ...this.collectParticipantIds(agendaItemIds) };
	}

	private pruneInternedEntities(referencedIds?: ReferencedInternedIds): void {
		const { agendaItemIds, staffMemberIds, groupIds } = referencedIds ?? this.collectReferencedIds();

		for (const id of this.agendaItems.keys()) {
			if (!agendaItemIds.has(id)) this.agendaItems.delete(id);
		}

		for (const id of this.staffMembers.keys()) {
			if (!staffMemberIds.has(id)) this.staffMembers.delete(id);
		}

		for (const id of this.groups.keys()) {
			if (!groupIds.has(id)) this.groups.delete(id);
		}
	}

	private stripLinks<T extends Participant | AgendaParticipant>(participant: T): Omit<T, 'links'> {
		if (!('links' in participant)) {
			return participant as Omit<T, 'links'>;
		}
		const { links: _links, ...rest } = participant;
		return rest as Omit<T, 'links'>;
	}

	private ingestParticipant(participant: Participant | AgendaParticipant): ParticipantRef | null {
		if (participant.type === 'medewerker') {
			const entity = this.stripLinks(participant);
			this.staffMembers.set(participant.id, entity);
			return { type: 'medewerker', id: participant.id };
		}

		if (participant.type === 'groep') {
			const entity = this.stripLinks(participant);
			this.groups.set(participant.id, entity);
			return { type: 'groep', id: participant.id };
		}

		return null;
	}

	private ingestAgendaItem(item: AgendaItem<Participant> | AgendaItem): void {
		const deelnames: ParticipantRef[] = [];
		for (const participant of item.deelnames) {
			const ref = this.ingestParticipant(participant);
			if (ref) deelnames.push(ref);
		}

		this.agendaItems.set(item.id, {
			...item,
			deelnames,
		});
	}

	private normalizeEntry(entry: AgendaEntry): StoredAgendaEntry {
		if (entry.kind === 'lesson') {
			this.ingestAgendaItem(entry.item);
			return {
				kind: 'lesson',
				start: entry.start,
				end: entry.end,
				itemId: entry.item.id,
			};
		}

		return entry;
	}

	private normalizeAgenda(agenda: Record<string, AgendaEntry[]>): Record<string, StoredAgendaEntry[]> {
		const normalized: Record<string, StoredAgendaEntry[]> = {};
		for (const [dateKey, entries] of Object.entries(agenda)) {
			normalized[dateKey] = entries.map((entry) => this.normalizeEntry(entry));
		}
		return normalized;
	}

	private hydrateParticipant(ref: ParticipantRef): AgendaParticipant | null {
		if (ref.type === 'medewerker') {
			const entity = this.staffMembers.get(ref.id);
			if (!entity) return null;
			return { ...entity, type: 'medewerker' };
		}

		const entity = this.groups.get(ref.id);
		if (!entity) return null;
		return { ...entity, type: 'groep' };
	}

	private hydrateAgendaItem(stored: StoredAgendaItem): AgendaItem {
		return {
			...stored,
			deelnames: stored.deelnames.flatMap((ref) => {
				const participant = this.hydrateParticipant(ref);
				return participant ? [participant] : [];
			}),
		};
	}

	private hydrateEntry(stored: StoredAgendaEntry): AgendaEntry | null {
		if (stored.kind === 'lesson') {
			const item = this.agendaItems.get(stored.itemId);
			if (!item) return null;
			return {
				kind: 'lesson',
				start: stored.start,
				end: stored.end,
				item: this.hydrateAgendaItem(item),
			};
		}

		return stored;
	}
}

function emptySnapshot(): StudentDataSnapshot {
	return {
		students: [],
		agendaItems: [],
		staffMembers: [],
		groups: [],
		studentAgenda: [],
		absenceNoticeLoad: [],
	};
}

export const studentDataStore = new StudentDataStore();
