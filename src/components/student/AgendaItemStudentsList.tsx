import { LuUsers } from 'react-icons/lu';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Student } from '@/magister/types';
import StudentListItem from './StudentListItem';

interface AgendaItemStudentsListProps {
	studentsByClass: Record<string, Student[]>;
	onOpenStudent?: (student: Student) => void;
}

export default function AgendaItemStudentsList({ studentsByClass, onOpenStudent }: AgendaItemStudentsListProps) {
	const totalStudents = Object.values(studentsByClass).flat().length;

	return (
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
						{Object.entries(studentsByClass).map(([className, studentsInClass]) => (
							<div key={className}>
								<p className="text-xs font-medium text-muted-foreground mb-1.5">{className}</p>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
									{studentsInClass.map((student) => (
										<StudentListItem
											key={student.id}
											student={student}
											onClick={(s) => onOpenStudent?.(s)}
										/>
									))}
								</div>
							</div>
						))}
					</div>
				</ScrollArea>
			)}
		</>
	);
}
