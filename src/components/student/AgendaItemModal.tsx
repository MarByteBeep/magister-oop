'use client';

import { useMemo, useState } from 'react';
import { LuClock, LuGraduationCap, LuMapPin, LuUsers } from 'react-icons/lu';
import LessonHourBadge from '@/components/LessonHourBadge';
import StudentModal from '@/components/StudentModal';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStudentsContext } from '@/context/StudentsContext';
import { getAgendaItemInfo } from '@/lib/agendaUtils';
import { formatTime, getDateKey } from '@/lib/dateUtils';
import { groupBy } from '@/lib/utils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { Student } from '@/magister/types';
import StudentListItem from './StudentListItem';

interface AgendaItemModalProps {
	item: AgendaItem;
	isOpen: boolean;
	onClose: () => void;
}

export default function AgendaItemModal({ item, isOpen, onClose }: AgendaItemModalProps) {
	const { students } = useStudentsContext();
	const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

	const { courseDescriptions, courseCodes, teachers, locations, subject } = getAgendaItemInfo(item);

	const beginTime = new Date(item.begin);
	const endTime = new Date(item.einde);
	const dateKey = getDateKey(beginTime);

	const lessonStart = formatTime(beginTime);
	const lessonEnd = formatTime(endTime);

	const firstLocationCode =
		item.locaties[0]?.code?.trim().toLowerCase() || item.locaties[0]?.omschrijving?.trim().toLowerCase() || '';

	const hasLocation = firstLocationCode !== '';

	// Find all students in the same lesson/location
	const studentsInLocation = useMemo(() => {
		if (!hasLocation) return {};

		const studentsFound: Student[] = [];

		for (const student of students) {
			const agendaForDay = student.agenda?.[dateKey];
			if (agendaForDay) {
				for (const agendaItem of agendaForDay) {
					const itemStart = new Date(agendaItem.begin);
					const itemEnd = new Date(agendaItem.einde);

					const itemStartTime = formatTime(itemStart);
					const itemEndTime = formatTime(itemEnd);

					const overlaps =
						(itemStartTime < lessonEnd && itemEndTime > lessonStart) ||
						(itemStartTime === lessonStart && itemEndTime === lessonEnd);

					if (overlaps) {
						const itemLocations = agendaItem.locaties
							.map((loc) => (loc.code ?? loc.omschrijving)?.trim().toLowerCase())
							.filter(Boolean);
						if (itemLocations.includes(firstLocationCode)) {
							studentsFound.push(student);
							break;
						}
					}
				}
			}
		}

		studentsFound.sort((a, b) => a.roepnaam.localeCompare(b.roepnaam));
		return groupBy(studentsFound, (student) => student.klassen.join(', '));
	}, [students, dateKey, firstLocationCode, lessonStart, lessonEnd, hasLocation]);

	const totalStudents = Object.values(studentsInLocation).flat().length;

	return (
		<>
			<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
				<DialogContent className="max-w-[800px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							{item.lesuur?.begin && (
								<LessonHourBadge
									lessonInfo={{ status: 'lesson', lesson: item.lesuur.begin }}
									className="h-7 w-7 text-sm"
								/>
							)}
							<span>{courseDescriptions ?? subject ?? 'Agenda item'}</span>
							{courseCodes && courseCodes !== courseDescriptions && (
								<Badge variant="secondary">{courseCodes}</Badge>
							)}
						</DialogTitle>
						<DialogDescription>Agenda item details en leerlingen in hetzelfde lokaal.</DialogDescription>
					</DialogHeader>

					{/* Compact info row */}
					<div className="flex flex-wrap gap-4 text-sm">
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<LuClock className="h-4 w-4" />
							<span className="font-medium text-foreground">
								{lessonStart} - {lessonEnd}
							</span>
						</div>

						{locations && (
							<div className="flex items-center gap-1.5 text-muted-foreground">
								<LuMapPin className="h-4 w-4" />
								<span className="font-medium text-foreground">{locations}</span>
							</div>
						)}

						{teachers && (
							<div className="flex items-center gap-1.5 text-muted-foreground">
								<LuGraduationCap className="h-4 w-4" />
								<span className="font-medium text-foreground">{teachers}</span>
							</div>
						)}
					</div>

					{/* Remark */}
					{item.opmerking && (
						<div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">{item.opmerking}</div>
					)}

					{/* Students section */}
					{hasLocation && (
						<>
							<hr className="border-border" />

							<div className="flex items-center gap-2">
								<LuUsers className="h-4 w-4 text-muted-foreground" />
								<span className="font-medium">Leerlingen ({totalStudents})</span>
							</div>

							{totalStudents === 0 ? (
								<p className="text-muted-foreground text-sm py-2">Geen andere leerlingen gevonden.</p>
							) : (
								<ScrollArea className="max-h-[400px] pr-2">
									<div className="space-y-3">
										{Object.entries(studentsInLocation).map(([className, studentsInClass]) => (
											<div key={className}>
												<p className="text-xs font-medium text-muted-foreground mb-1.5">
													{className}
												</p>
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
								</ScrollArea>
							)}
						</>
					)}
				</DialogContent>
			</Dialog>

			{selectedStudent && <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
		</>
	);
}
