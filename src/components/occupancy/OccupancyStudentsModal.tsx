'use client';

import { useState } from 'react';
import StudentDetailDialog from '@/components/student/StudentDetailDialog';
import StudentListItem from '@/components/student/StudentListItem';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useStudentsContext } from '@/context/StudentsContext';
import type { Student } from '@/magister/types';
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

const MAX_LABEL_LENGTH = 40;

function capLabel(text: string): string {
	return text.length > MAX_LABEL_LENGTH ? `${text.slice(0, MAX_LABEL_LENGTH - 1)}…` : text;
}

function formatClassGroupTitle(group: OccupancyClassGroup, cap = false): string {
	const parts = [`Klas: ${group.className}`];
	if (group.subject) parts.push(cap ? capLabel(group.subject) : group.subject);
	if (group.teacher) parts.push(cap ? capLabel(group.teacher) : group.teacher);
	return parts.join(', ');
}

function StudentsByClass({
	classGroups,
	onStudentClick,
}: {
	classGroups: OccupancyClassGroup[];
	onStudentClick: (student: Student) => void;
}) {
	return (
		<div className="space-y-4">
			{classGroups.map((group) => {
				const title = formatClassGroupTitle(group, true);
				const fullTitle = formatClassGroupTitle(group);

				return (
					<div key={group.className} className="border rounded-md p-3 bg-card">
						<h4 className="font-semibold text-lg mb-2 text-foreground truncate" title={fullTitle}>
							{title}
						</h4>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{group.students.map((student) => (
								<StudentListItem key={student.id} student={student} onClick={onStudentClick} />
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}

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
						{isEmpty ? (
							<p className="text-muted-foreground text-center py-4">
								Geen leerlingen gevonden voor dit lesuur.
							</p>
						) : showBreakStudents ? (
							activeStudentCount > 0 ? (
								<StudentsByClass classGroups={activeClassGroups} onStudentClick={setSelectedStudent} />
							) : (
								<p className="text-muted-foreground text-center py-4">
									{viewMode === 'lesson'
										? 'Geen leerlingen met les in dit lesblok.'
										: 'Geen leerlingen met tussenuur in dit lesblok.'}
								</p>
							)
						) : (
							<StudentsByClass classGroups={studentsWithLesson} onStudentClick={setSelectedStudent} />
						)}
					</ScrollArea>
				</DialogContent>
			</Dialog>

			{selectedStudent && (
				<StudentDetailDialog student={selectedStudent} onClose={() => setSelectedStudent(null)} />
			)}
		</>
	);
}
