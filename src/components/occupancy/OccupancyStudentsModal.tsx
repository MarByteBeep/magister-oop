'use client';

import { useState } from 'react';
import StudentDetailDialog from '@/components/student/StudentDetailDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useStudentsContext } from '@/context/StudentsContext';
import type { Student } from '@/types/student.types';
import OccupancyStudentsModalContent from './OccupancyStudentsModalContent';
import type { OccupancyClassGroup } from './useOccupancyStudentsModalData';
import { useOccupancyStudentsModalData } from './useOccupancyStudentsModalData';

interface OccupancyStudentsModalProps {
	isOpen: boolean;
	onClose: () => void;
	lessonRange: string;
	dateKey: string;
	locations: string[];
	showBreakStudents: boolean;
}

type OccupancyViewMode = 'lesson' | 'break';

const occupancyToggleItemClass =
	'flex-1 transition-none data-[state=on]:border-transparent data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm';

function getModalTitle(lessonRange: string, locations: string[], showBreakStudents: boolean) {
	if (!showBreakStudents && locations.length === 1) {
		return `Leerlingen in ${locations[0].toLowerCase()} (${lessonRange})`;
	}
	if (locations.length === 1) {
		return `Bezetting ${locations[0].toLowerCase()} (${lessonRange})`;
	}
	return `Bezetting geselecteerde lokalen (${lessonRange})`;
}

function countStudentsInGroups(classGroups: OccupancyClassGroup[]): number {
	return classGroups.reduce((sum, group) => sum + group.students.length, 0);
}

export default function OccupancyStudentsModal({
	isOpen,
	onClose,
	lessonRange,
	dateKey,
	locations,
	showBreakStudents,
}: OccupancyStudentsModalProps) {
	const { students } = useStudentsContext();
	const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
	const [viewMode, setViewMode] = useState<OccupancyViewMode>('lesson');

	const { studentsWithLesson, studentsWithBreak } = useOccupancyStudentsModalData(
		students,
		dateKey,
		lessonRange,
		locations,
	);

	const hasLessonStudents = studentsWithLesson.length > 0;
	const hasBreakStudents = studentsWithBreak.length > 0;
	const isEmpty = !hasLessonStudents && (!showBreakStudents || !hasBreakStudents);
	const activeClassGroups = viewMode === 'lesson' ? studentsWithLesson : studentsWithBreak;
	const activeStudentCount = countStudentsInGroups(activeClassGroups);

	return (
		<>
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent className="max-w-[900px] h-[700px] flex flex-col">
					<DialogHeader className="shrink-0">
						<DialogTitle className="text-center">
							{getModalTitle(lessonRange, locations, showBreakStudents)}
						</DialogTitle>
					</DialogHeader>

					{showBreakStudents && !isEmpty && (
						<ToggleGroup
							type="single"
							value={viewMode}
							onValueChange={(value) => {
								if (value === 'lesson' || value === 'break') setViewMode(value);
							}}
							className="w-full shrink-0"
						>
							<ToggleGroupItem value="lesson" className={occupancyToggleItemClass}>
								Met les ({countStudentsInGroups(studentsWithLesson)})
							</ToggleGroupItem>
							<ToggleGroupItem value="break" className={occupancyToggleItemClass}>
								Tussenuur ({countStudentsInGroups(studentsWithBreak)})
							</ToggleGroupItem>
						</ToggleGroup>
					)}

					<ScrollArea className="flex-1 pr-4">
						<OccupancyStudentsModalContent
							isEmpty={isEmpty}
							showBreakStudents={showBreakStudents}
							viewMode={viewMode}
							activeStudentCount={activeStudentCount}
							activeClassGroups={activeClassGroups}
							studentsWithLesson={studentsWithLesson}
							onStudentClick={setSelectedStudent}
						/>
					</ScrollArea>
				</DialogContent>
			</Dialog>

			{selectedStudent && (
				<StudentDetailDialog student={selectedStudent} onClose={() => setSelectedStudent(null)} />
			)}
		</>
	);
}
