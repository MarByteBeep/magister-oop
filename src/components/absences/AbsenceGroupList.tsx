'use client';

import type { AbsenceRow } from '@/lib/absenceUtils';
import type { Student } from '@/magister/types';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import AbsenceGroupRow from './AbsenceGroupRow';

interface AbsenceGroupListProps {
	orderedReasons: { key: string; label: string }[];
	byReason: Map<string, AbsenceRow[]>;
	studentById: Map<number, Student>;
	onSelectStudent: (studentId: number) => void;
}

export default function AbsenceGroupList({
	orderedReasons,
	byReason,
	studentById,
	onSelectStudent,
}: AbsenceGroupListProps) {
	if (orderedReasons.length === 0) {
		return <p className="text-sm text-muted-foreground">Geen absenties gevonden.</p>;
	}

	return (
		<>
			{orderedReasons.map(({ key, label }) => {
				const rows = byReason.get(key) ?? [];
				if (!rows.length) return null;

				return (
					<Card key={key} className="text-left">
						<CardHeader className="py-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-lg flex items-center gap-2">
									{label} <Badge variant="secondary">{rows.length}</Badge>
								</CardTitle>
							</div>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{rows.map((row, idx) => (
									<AbsenceGroupRow
										key={`${row.studentId}-${row.lesuurBegin}-${row.lesuurEinde}-${idx}`}
										row={row}
										student={studentById.get(row.studentId)}
										onSelectStudent={onSelectStudent}
									/>
								))}
							</div>

							{rows.some((r) => !studentById.has(r.studentId)) ? (
								<p className="text-xs text-muted-foreground pt-3">
									Sommige leerlingen zijn nog niet geladen in de leerlingenlijst, dus die zijn (nog)
									niet klikbaar.
								</p>
							) : null}
						</CardContent>
					</Card>
				);
			})}
		</>
	);
}
