'use client';

import { useMemo, useState } from 'react';
import StudentModal from '@/components/StudentModal';
import StudentListItem from '@/components/student/StudentListItem';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudentsContext } from '@/context/StudentsContext';
import { groupBy } from '@/lib/utils';
import type { AttendanceStaffMember } from '@/magister/response/agenda.types';
import type { Student } from '@/magister/types';

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

	const [lessonStart, lessonEnd] = lessonRange.split('-');

	const studentsInLocation = useMemo(() => {
		const studentsFound: Student[] = [];

		for (const student of students) {
			const agendaForDay = student.agenda?.[dateKey];
			if (agendaForDay) {
				for (const item of agendaForDay) {
					const itemStart = new Date(item.begin);
					const itemEnd = new Date(item.einde);

					// Check if the agenda item overlaps with the lesson range
					const itemStartTime = `${String(itemStart.getHours()).padStart(2, '0')}:${String(itemStart.getMinutes()).padStart(2, '0')}`;
					const itemEndTime = `${String(itemEnd.getHours()).padStart(2, '0')}:${String(itemEnd.getMinutes()).padStart(2, '0')}`;

					const overlaps =
						(itemStartTime < lessonEnd && itemEndTime > lessonStart) ||
						(itemStartTime === lessonStart && itemEndTime === lessonEnd);

					if (overlaps) {
						const itemLocations = item.locaties
							.map((loc) => (loc.code ?? loc.omschrijving)?.trim().toLowerCase())
							.filter(Boolean);
						if (itemLocations.includes(locationCode)) {
							studentsFound.push(student);
							break; // Student found for this location/lesson, move to next student
						}
					}
				}
			}
		}

		// Sort students by first name
		studentsFound.sort((a, b) => a.roepnaam.localeCompare(b.roepnaam));

		// Group by class
		return groupBy(studentsFound, (student) => student.klassen.join(', '));
	}, [students, dateKey, locationCode, lessonStart, lessonEnd]);

	const uniqueTeachers = useMemo(() => {
		const teachersMap = new Map<number, AttendanceStaffMember>();

		for (const student of students) {
			const agendaForDay = student.agenda?.[dateKey];
			if (agendaForDay) {
				for (const item of agendaForDay) {
					const itemStart = new Date(item.begin);
					const itemEnd = new Date(item.einde);

					const itemStartTime = `${String(itemStart.getHours()).padStart(2, '0')}:${String(itemStart.getMinutes()).padStart(2, '0')}`;
					const itemEndTime = `${String(itemEnd.getHours()).padStart(2, '0')}:${String(itemEnd.getMinutes()).padStart(2, '0')}`;

					const overlaps =
						(itemStartTime < lessonEnd && itemEndTime > lessonStart) ||
						(itemStartTime === lessonStart && itemEndTime === lessonEnd);

					if (overlaps) {
						const itemLocations = item.locaties
							.map((loc) => (loc.code ?? loc.omschrijving)?.trim().toLowerCase())
							.filter(Boolean);
						if (itemLocations.includes(locationCode)) {
							item.deelnames
								.filter((p) => p.type === 'medewerker')
								.forEach((teacher) => {
									teachersMap.set(teacher.id, teacher as AttendanceStaffMember);
								});
						}
					}
				}
			}
		}
		return Array.from(teachersMap.values()).sort((a, b) => a.achternaam.localeCompare(b.achternaam));
	}, [students, dateKey, locationCode, lessonStart, lessonEnd]);

	const uniqueSubjects = useMemo(() => {
		const subjects = new Set<string>();

		for (const student of students) {
			const agendaForDay = student.agenda?.[dateKey];
			if (agendaForDay) {
				for (const item of agendaForDay) {
					const itemStart = new Date(item.begin);
					const itemEnd = new Date(item.einde);

					const itemStartTime = `${String(itemStart.getHours()).padStart(2, '0')}:${String(itemStart.getMinutes()).padStart(2, '0')}`;
					const itemEndTime = `${String(itemEnd.getHours()).padStart(2, '0')}:${String(itemEnd.getMinutes()).padStart(2, '0')}`;

					const overlaps =
						(itemStartTime < lessonEnd && itemEndTime > lessonStart) ||
						(itemStartTime === lessonStart && itemEndTime === lessonEnd);

					if (overlaps) {
						const itemLocations = item.locaties
							.map((loc) => (loc.code ?? loc.omschrijving)?.trim().toLowerCase())
							.filter(Boolean);
						if (itemLocations.includes(locationCode)) {
							item.vakken.forEach((vak) => {
								if (vak.omschrijving) {
									subjects.add(vak.omschrijving);
								}
							});
						}
					}
				}
			}
		}
		return Array.from(subjects).sort();
	}, [students, dateKey, locationCode, lessonStart, lessonEnd]);

	const handleStudentClick = (student: Student) => {
		setSelectedStudent(student);
	};

	const handleCloseStudentModal = () => {
		setSelectedStudent(null);
	};

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
						{(uniqueSubjects.length > 0 || uniqueTeachers.length > 0) && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
								{uniqueSubjects.length > 0 && (
									<Card>
										<CardHeader>
											<CardTitle className="text-lg">Vakken</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="flex flex-wrap gap-2">
												{uniqueSubjects.map((subject) => (
													<Badge key={subject} variant="secondary" className="text-sm">
														{subject}
													</Badge>
												))}
											</div>
										</CardContent>
									</Card>
								)}

								{uniqueTeachers.length > 0 && (
									<Card>
										<CardHeader>
											<CardTitle className="text-lg">Docenten</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="flex flex-wrap gap-2">
												{uniqueTeachers.map((teacher) => (
													<Badge key={teacher.id} variant="secondary" className="text-sm">
														{teacher.roepnaam} {teacher.tussenvoegsel} {teacher.achternaam}{' '}
														({teacher.code})
													</Badge>
												))}
											</div>
										</CardContent>
									</Card>
								)}
							</div>
						)}

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
													onClick={handleStudentClick}
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

			{selectedStudent && <StudentModal student={selectedStudent} onClose={handleCloseStudentModal} />}
		</>
	);
}
