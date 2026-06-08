'use client';

import { useState } from 'react';
import StudentDetailDialog from '@/components/student/StudentDetailDialog';
import StudentListItem from '@/components/student/StudentListItem';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudentsContext } from '@/context/StudentsContext';
import type { Student } from '@/magister/types';
import OccupancyModalMetadata from './OccupancyModalMetadata';
import { useOccupancyStudentsModalData } from './useOccupancyStudentsModalData';

interface OccupancyStudentsModalProps {
	isOpen: boolean;
	onClose: () => void;
	locationCode: string;
	lessonRange: string;
	dateKey: string;
}

export default function OccupancyStudentsModal({
	isOpen,
	onClose,
	locationCode,
	lessonRange,
	dateKey,
}: OccupancyStudentsModalProps) {
	const { students } = useStudentsContext();
	const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

	const { studentsInLocation, uniqueTeachers, uniqueSubjects } = useOccupancyStudentsModalData(
		students,
		dateKey,
		lessonRange,
		locationCode,
	);

	return (
		<>
			<Dialog open={isOpen} onOpenChange={onClose}>
				<DialogContent className="max-w-[900px] h-[700px] flex flex-col">
					<DialogHeader className="shrink-0">
						<DialogTitle className="text-center">
							Leerlingen in {locationCode.toLowerCase()} ({lessonRange})
						</DialogTitle>
						<DialogDescription className="text-center">
							Overzicht van alle leerlingen die op dit moment in dit lokaal zijn.
						</DialogDescription>
					</DialogHeader>

					<ScrollArea className="flex-1 pr-4">
						<OccupancyModalMetadata subjects={uniqueSubjects} teachers={uniqueTeachers} />

						{Object.keys(studentsInLocation).length === 0 ? (
							<p className="text-muted-foreground text-center py-4">
								Geen leerlingen gevonden voor dit lokaal en lesuur.
							</p>
						) : (
							<div className="space-y-4">
								{Object.entries(studentsInLocation).map(([className, studentsInClass]) => (
									<div key={className} className="border rounded-md p-3 bg-card">
										<h3 className="font-semibold text-lg mb-2 text-foreground">
											Klas: {className}
										</h3>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											{studentsInClass.map((student) => (
												<StudentListItem
													key={student.id}
													student={student}
													onClick={setSelectedStudent}
												/>
											))}
										</div>
									</div>
								))}
							</div>
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
