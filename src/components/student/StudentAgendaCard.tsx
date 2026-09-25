'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getNow, getWorkWeekRange } from '@/lib/dateUtils';
import type { Student } from '@/types/student.types';
import AgendaSyncButton from './AgendaSyncButton';
import DailyAgendaView from './DailyAgendaView';

interface StudentAgendaCardProps {
	student: Student;
	onOpenStudent?: (student: Student) => void;
}

export default function StudentAgendaCard({ student, onOpenStudent }: StudentAgendaCardProps) {
	const { start, end } = getWorkWeekRange(getNow());

	return (
		<Card className="relative row-span-2 col-start-3 row-start-1 flex flex-col">
			<CardHeader>
				<CardTitle>Rooster</CardTitle>
			</CardHeader>
			<AgendaSyncButton
				studentId={student.id}
				rangeStart={start}
				rangeEnd={end}
				className="absolute top-4 right-4 z-10"
				tooltipReady="Vernieuw rooster voor deze week"
				tooltipLoading="Rooster wordt geladen…"
			/>
			<CardContent className="flex-1 min-h-0 p-0">
				<DailyAgendaView studentId={student.id} onOpenStudent={onOpenStudent} />
			</CardContent>
		</Card>
	);
}
