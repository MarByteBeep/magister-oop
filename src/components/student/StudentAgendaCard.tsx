'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getNow } from '@/lib/dateUtils';
import type { Student } from '@/magister/types';
import AgendaSyncButton from './AgendaSyncButton';
import DailyAgendaView from './DailyAgendaView';

interface StudentAgendaCardProps {
	student: Student;
	onOpenStudent?: (student: Student) => void;
}

export default function StudentAgendaCard({ student, onOpenStudent }: StudentAgendaCardProps) {
	return (
		<Card className="relative row-span-2 col-start-3 row-start-1 flex flex-col">
			<CardHeader>
				<CardTitle>Rooster</CardTitle>
			</CardHeader>
			<AgendaSyncButton
				studentId={student.id}
				rangeStart={getNow()}
				rangeEnd={getNow()}
				className="absolute top-4 right-4 z-10"
				tooltipReady="Vernieuw agenda voor vandaag"
				tooltipLoading="Agenda wordt geladen…"
			/>
			<CardContent className="flex-1 min-h-0 p-0">
				<DailyAgendaView studentId={student.id} onOpenStudent={onOpenStudent} />
			</CardContent>
		</Card>
	);
}
