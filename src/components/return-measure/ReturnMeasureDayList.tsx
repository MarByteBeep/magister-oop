'use client';

import ReturnMeasureRow from '@/components/return-measure/ReturnMeasureRow';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReturnMeasureDayGroup } from '@/lib/return-measure/overview';
import { formatDayLabel } from '@/lib/shared/dateLabels';
import { parseDateKey } from '@/lib/shared/dateUtils';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';
import type { Student } from '@/types/student.types';

interface ReturnMeasureDayListProps {
	groups: ReturnMeasureDayGroup[];
	studentById: Map<number, Student>;
	emptyMessage: string;
	onSelectMeasure: (measure: ReturnMeasureStudent) => void;
}

export default function ReturnMeasureDayList({
	groups,
	studentById,
	emptyMessage,
	onSelectMeasure,
}: ReturnMeasureDayListProps) {
	if (groups.length === 0) {
		return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
	}

	return (
		<>
			{groups.map((group) => (
				<Card key={group.dateKey ?? 'niet-ingepland'} className="text-left">
					<CardHeader className="py-3">
						<CardTitle className="text-lg flex items-center gap-2">
							{group.dateKey ? formatDayLabel(parseDateKey(group.dateKey)) : 'Nog niet ingepland'}
							<Badge variant="secondary">{group.rows.length}</Badge>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{group.rows.map((row) => (
								<ReturnMeasureRow
									key={row.id}
									row={row}
									student={studentById.get(row.studentId)}
									onSelectMeasure={onSelectMeasure}
								/>
							))}
						</div>
					</CardContent>
				</Card>
			))}
		</>
	);
}
