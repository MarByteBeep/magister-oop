'use client';

import type { Student } from '@/types/student.types';
import OccupancyStudentsByClass from './OccupancyStudentsByClass';
import type { OccupancyClassGroup } from './useOccupancyStudentsModalData';

export type OccupancyViewMode = 'lesson' | 'break';

export interface OccupancyStudentsModalContentProps {
	isEmpty: boolean;
	showBreakStudents: boolean;
	viewMode: OccupancyViewMode;
	activeStudentCount: number;
	activeClassGroups: OccupancyClassGroup[];
	studentsWithLesson: OccupancyClassGroup[];
	onStudentClick: (student: Student) => void;
}

function emptyViewMessage(viewMode: OccupancyViewMode): string {
	if (viewMode === 'lesson') return 'Geen leerlingen met les in dit lesblok.';
	return 'Geen leerlingen met tussenuur in dit lesblok.';
}

type OccupancyBreakOrLessonContentProps = Omit<OccupancyStudentsModalContentProps, 'isEmpty'>;

function OccupancyBreakOrLessonContent(props: OccupancyBreakOrLessonContentProps) {
	if (!props.showBreakStudents) {
		return (
			<OccupancyStudentsByClass classGroups={props.studentsWithLesson} onStudentClick={props.onStudentClick} />
		);
	}
	if (props.activeStudentCount === 0) {
		return <p className="text-muted-foreground text-center py-4">{emptyViewMessage(props.viewMode)}</p>;
	}
	return <OccupancyStudentsByClass classGroups={props.activeClassGroups} onStudentClick={props.onStudentClick} />;
}

export default function OccupancyStudentsModalContent(props: OccupancyStudentsModalContentProps) {
	if (props.isEmpty) {
		return <p className="text-muted-foreground text-center py-4">Geen leerlingen gevonden voor dit lesuur.</p>;
	}
	return (
		<OccupancyBreakOrLessonContent
			showBreakStudents={props.showBreakStudents}
			viewMode={props.viewMode}
			activeStudentCount={props.activeStudentCount}
			activeClassGroups={props.activeClassGroups}
			studentsWithLesson={props.studentsWithLesson}
			onStudentClick={props.onStudentClick}
		/>
	);
}
