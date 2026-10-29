'use client';

import { useState } from 'react';
import StudentDetailDialog from '@/components/student/profile/StudentDetailDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useStudentsContext } from '@/context/StudentsContext';
import type { Student } from '@/types/student.types';
import OccupancyStudentsModalContent from './OccupancyStudentsModalContent';
import type { OccupancyClassGroup } from './useOccupancyStudentsModalData';
import { useOccupancyStudentsModalData } from './useOccupancyStudentsModalData';

export interface OccupancyStudentsModalProps {
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

function singleLocationLabel(locations: string[]): string | undefined {
	if (locations.length !== 1) return undefined;
	return locations[0].toLowerCase();
}

function getModalTitle(lessonRange: string, locations: string[], showBreakStudents: boolean) {
	const location = singleLocationLabel(locations);
	if (!location) return `Bezetting geselecteerde lokalen (${lessonRange})`;
	const prefixes = [`Leerlingen in ${location}`, `Bezetting ${location}`];
	return `${prefixes[Number(showBreakStudents)]} (${lessonRange})`;
}

function countStudentsInGroups(classGroups: OccupancyClassGroup[]): number {
	return classGroups.reduce((sum, group) => sum + group.students.length, 0);
}

function isOccupancyEmpty(hasLessonStudents: boolean, hasBreakStudents: boolean, showBreakStudents: boolean): boolean {
	if (hasLessonStudents) return false;
	if (!showBreakStudents) return true;
	return !hasBreakStudents;
}

function shouldShowViewToggle(showBreakStudents: boolean, isEmpty: boolean): boolean {
	if (!showBreakStudents) return false;
	return !isEmpty;
}

function parseViewMode(value: string): OccupancyViewMode | undefined {
	if (value === 'lesson') return 'lesson';
	if (value === 'break') return 'break';
	return undefined;
}

function ViewModeToggle({
	viewMode,
	onViewModeChange,
	lessonCount,
	breakCount,
}: {
	viewMode: OccupancyViewMode;
	onViewModeChange: (value: OccupancyViewMode) => void;
	lessonCount: number;
	breakCount: number;
}) {
	return (
		<ToggleGroup
			type="single"
			value={viewMode}
			onValueChange={(value) => {
				const next = parseViewMode(value);
				if (next) onViewModeChange(next);
			}}
			className="w-full shrink-0"
		>
			<ToggleGroupItem value="lesson" className={occupancyToggleItemClass}>
				Met les ({lessonCount})
			</ToggleGroupItem>
			<ToggleGroupItem value="break" className={occupancyToggleItemClass}>
				Tussenuur ({breakCount})
			</ToggleGroupItem>
		</ToggleGroup>
	);
}

function OccupancyViewToggleSection({
	show,
	viewMode,
	onViewModeChange,
	lessonCount,
	breakCount,
}: {
	show: boolean;
	viewMode: OccupancyViewMode;
	onViewModeChange: (value: OccupancyViewMode) => void;
	lessonCount: number;
	breakCount: number;
}) {
	if (!show) return null;
	return (
		<ViewModeToggle
			viewMode={viewMode}
			onViewModeChange={onViewModeChange}
			lessonCount={lessonCount}
			breakCount={breakCount}
		/>
	);
}

function SelectedStudentDialog({ student, onClose }: { student: Student | null; onClose: () => void }) {
	if (!student) return null;
	return <StudentDetailDialog student={student} onClose={onClose} />;
}

function useOccupancyStudentsModalState(
	dateKey: string,
	lessonRange: string,
	locations: string[],
	showBreakStudents: boolean,
) {
	const { students } = useStudentsContext();
	const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
	const [viewMode, setViewMode] = useState<OccupancyViewMode>('lesson');
	const { studentsWithLesson, studentsWithBreak } = useOccupancyStudentsModalData(
		students,
		dateKey,
		lessonRange,
		locations,
	);

	const activeClassGroups = [studentsWithBreak, studentsWithLesson][Number(viewMode === 'lesson')];
	const isEmpty = isOccupancyEmpty(studentsWithLesson.length > 0, studentsWithBreak.length > 0, showBreakStudents);

	return {
		selectedStudent,
		setSelectedStudent,
		viewMode,
		setViewMode,
		studentsWithLesson,
		studentsWithBreak,
		activeClassGroups,
		isEmpty,
		showToggle: shouldShowViewToggle(showBreakStudents, isEmpty),
	};
}

export default function OccupancyStudentsModal({
	isOpen,
	onClose,
	lessonRange,
	dateKey,
	locations,
	showBreakStudents,
}: OccupancyStudentsModalProps) {
	const state = useOccupancyStudentsModalState(dateKey, lessonRange, locations, showBreakStudents);

	return (
		<>
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent className="max-w-[900px] h-[700px] flex flex-col">
					<DialogHeader className="shrink-0">
						<DialogTitle className="text-center">
							{getModalTitle(lessonRange, locations, showBreakStudents)}
						</DialogTitle>
					</DialogHeader>

					<OccupancyViewToggleSection
						show={state.showToggle}
						viewMode={state.viewMode}
						onViewModeChange={state.setViewMode}
						lessonCount={countStudentsInGroups(state.studentsWithLesson)}
						breakCount={countStudentsInGroups(state.studentsWithBreak)}
					/>

					<ScrollArea className="flex-1 pr-4">
						<OccupancyStudentsModalContent
							isEmpty={state.isEmpty}
							showBreakStudents={showBreakStudents}
							viewMode={state.viewMode}
							activeStudentCount={countStudentsInGroups(state.activeClassGroups)}
							activeClassGroups={state.activeClassGroups}
							studentsWithLesson={state.studentsWithLesson}
							onStudentClick={state.setSelectedStudent}
						/>
					</ScrollArea>
				</DialogContent>
			</Dialog>

			<SelectedStudentDialog student={state.selectedStudent} onClose={() => state.setSelectedStudent(null)} />
		</>
	);
}
