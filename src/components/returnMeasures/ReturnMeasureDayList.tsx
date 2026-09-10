'use client';

import ReturnMeasureRow from '@/components/returnMeasures/ReturnMeasureRow';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDayLabel } from '@/lib/dateLabels';
import { getTodayKey, parseDateKey } from '@/lib/dateUtils';
import type { ReturnMeasureDayGroup } from '@/lib/returnMeasureOverview';
import type { Student } from '@/magister/types';

interface ReturnMeasureDayListProps {
	groups: ReturnMeasureDayGroup[];
	studentById: Map<number, Student>;
	emptyMessage: string;
	onSelectStudent: (studentId: number) => void;
}

export default function ReturnMeasureDayList({
	groups,
	studentById,
	emptyMessage,
	onSelectStudent,
}: ReturnMeasureDayListProps) {
	if (groups.length === 0) {
		return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
	}

	const todayKey = getTodayKey();

	return (
		<>
			{groups.map((group) => (
				<Card key={group.dateKey ?? 'niet-ingepland'} className="text-left">
					<CardHeader className="py-3">
						<CardTitle className="text-lg flex items-center gap-2">
							{group.dateKey ? formatDayLabel(parseDateKey(group.dateKey)) : 'Nog niet ingepland'}
							<Badge variant="secondary">{group.rows.length}</Badge>
							{group.dateKey === todayKey && <Badge>Vandaag</Badge>}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{group.rows.map((row) => (
								<ReturnMeasureRow
									key={row.id}
									row={row}
									student={studentById.get(row.studentId)}
									onSelectStudent={onSelectStudent}
								/>
							))}
						</div>

						{group.rows.some((row) => !studentById.has(row.studentId)) ? (
							<p className="text-xs text-muted-foreground pt-3">
								Sommige leerlingen zijn nog niet geladen in de leerlingenlijst, dus die zijn (nog) niet
								klikbaar.
							</p>
						) : null}
					</CardContent>
				</Card>
			))}
		</>
	);
}
