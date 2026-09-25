'use client';

import type { Student } from '@/types/student.types';
import OccupancyStudentsByClass from './OccupancyStudentsByClass';
import type { OccupancyClassGroup } from './useOccupancyStudentsModalData';

type OccupancyViewMode = 'lesson' | 'break';

interface OccupancyStudentsModalContentProps {
	isEmpty: boolean;
	showBreakStudents: boolean;
	viewMode: OccupancyViewMode;
	activeStudentCount: number;
	activeClassGroups: OccupancyClassGroup[];
	studentsWithLesson: OccupancyClassGroup[];
	onStudentClick: (student: Student) => void;
}

function emptyViewMessage(viewMode: OccupancyViewMode): string {
	return viewMode === 'lesson'
		? 'Geen leerlingen met les in dit lesblok.'
		: 'Geen leerlingen met tussenuur in dit lesblok.';
}

export default function OccupancyStudentsModalContent({
	isEmpty,
	showBreakStudents,
	viewMode,
	activeStudentCount,
	activeClassGroups,
	studentsWithLesson,
	onStudentClick,
}: OccupancyStudentsModalContentProps) {
	if (isEmpty) {
		return <p className="text-muted-foreground text-center py-4">Geen leerlingen gevonden voor dit lesuur.</p>;
	}

	if (!showBreakStudents) {
		return <OccupancyStudentsByClass classGroups={studentsWithLesson} onStudentClick={onStudentClick} />;
	}

	if (activeStudentCount === 0) {
		return <p className="text-muted-foreground text-center py-4">{emptyViewMessage(viewMode)}</p>;
	}

	return <OccupancyStudentsByClass classGroups={activeClassGroups} onStudentClick={onStudentClick} />;
}
