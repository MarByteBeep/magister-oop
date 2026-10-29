'use client';

import { groupRegistrationRowsByStudent, type RegistrationRow } from '@/lib/registrations/utils';
import type { Student } from '@/types/student.types';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import RegistrationGroupRow from './RegistrationGroupRow';

export interface RegistrationGroupListProps {
	orderedReasons: { key: string; label: string }[];
	byReason: Map<string, RegistrationRow[]>;
	studentById: Map<number, Student>;
	onSelectStudent: (studentId: number) => void;
}

function rowsForReason(byReason: Map<string, RegistrationRow[]>, key: string): RegistrationRow[] {
	return byReason.get(key) ?? [];
}

function hasUnloadedStudents(rows: RegistrationRow[], studentById: Map<number, Student>): boolean {
	return rows.some((r) => !studentById.has(r.studentId));
}

function UnloadedStudentsNote({ show }: { show: boolean }) {
	if (!show) return null;
	return (
		<p className="text-xs text-muted-foreground pt-3">
			Sommige leerlingen zijn nog niet geladen in de leerlingenlijst, dus die zijn (nog) niet klikbaar.
		</p>
	);
}

function RegistrationReasonCard(props: {
	reasonKey: string;
	label: string;
	rows: RegistrationRow[];
	studentById: Map<number, Student>;
	onSelectStudent: (studentId: number) => void;
}) {
	if (!props.rows.length) return null;

	return (
		<Card className="text-left">
			<CardHeader className="py-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg flex items-center gap-2">
						{props.label} <Badge variant="secondary">{props.rows.length}</Badge>
					</CardTitle>
				</div>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{groupRegistrationRowsByStudent(props.rows).map((group) => (
						<RegistrationGroupRow
							key={group.studentId}
							registrations={group.registrations}
							student={props.studentById.get(group.studentId)}
							onSelectStudent={props.onSelectStudent}
						/>
					))}
				</div>
				<UnloadedStudentsNote show={hasUnloadedStudents(props.rows, props.studentById)} />
			</CardContent>
		</Card>
	);
}

export default function RegistrationGroupList(props: RegistrationGroupListProps) {
	if (props.orderedReasons.length === 0) {
		return <p className="text-sm text-muted-foreground">Geen registraties.</p>;
	}

	return (
		<>
			{props.orderedReasons.map(({ key, label }) => (
				<RegistrationReasonCard
					key={key}
					reasonKey={key}
					label={label}
					rows={rowsForReason(props.byReason, key)}
					studentById={props.studentById}
					onSelectStudent={props.onSelectStudent}
				/>
			))}
		</>
	);
}
