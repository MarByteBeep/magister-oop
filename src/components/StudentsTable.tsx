import ClickAvatarPreview from '@/components/ClickAvatarPreview';
import type { SortColumn, SortDirection } from '@/hooks/useStudentListFilters';
import type { LessonInfo } from '@/lib/agendaUtils';
import type { Student } from '@/magister/types';
import LessonHourBadge from './LessonHourBadge';
import AgendaItemDisplay from './student/AgendaItemDisplay';

interface StudentsTableProps {
	sortedStudents: Student[];
	filteredCount: number;
	sortColumn: SortColumn;
	sortDirection: SortDirection;
	currentLessonInfo: LessonInfo;
	nextLessonInfo: LessonInfo;
	onSort: (column: SortColumn) => void;
	onRowClick: (student: Student) => void;
}

function getSortIndicator(sortColumn: SortColumn, column: SortColumn, sortDirection: SortDirection) {
	return sortColumn === column ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : '';
}

export default function StudentsTable({
	sortedStudents,
	filteredCount,
	sortColumn,
	sortDirection,
	currentLessonInfo,
	nextLessonInfo,
	onSort,
	onRowClick,
}: StudentsTableProps) {
	return (
		<div className="overflow-x-auto border rounded-lg shadow-sm">
			<table className="min-w-full divide-y divide-border">
				<thead className="bg-muted text-xs font-medium text-muted-foreground uppercase tracking-wider text-center cursor-pointer">
					<tr>
						<th className="text-center">
							{sortedStudents.length} van {filteredCount}
						</th>
						<th scope="col" onClick={() => onSort('naam')} className="px-6 py-3">
							Naam{getSortIndicator(sortColumn, 'naam', sortDirection)}
						</th>
						<th scope="col" onClick={() => onSort('klas')}>
							Klas{getSortIndicator(sortColumn, 'klas', sortDirection)}
						</th>
						<th
							scope="col"
							className="px-6 py-3"
							onClick={() => onSort('lockerCode')}
							title="Gebruik 'k:' voor kluisje"
						>
							Kluisje{getSortIndicator(sortColumn, 'lockerCode', sortDirection)}
						</th>
						<th scope="col" className="px-6 py-3 w-34" onClick={() => onSort('now')}>
							<div className="flex items-center justify-center gap-1">
								{currentLessonInfo.lesson && <LessonHourBadge lessonInfo={currentLessonInfo} />}
								<span>{currentLessonInfo.range ?? 'Geen les'}</span>
							</div>
							{getSortIndicator(sortColumn, 'now', sortDirection)}
						</th>
						<th scope="col" className="px-6 py-3 w-34" onClick={() => onSort('next')}>
							<div className="flex items-center justify-center gap-1">
								{nextLessonInfo.lesson && (
									<LessonHourBadge lessonInfo={nextLessonInfo} className="bg-primary/40" />
								)}
								<span>{nextLessonInfo.range ?? 'Geen les'}</span>
							</div>
							{getSortIndicator(sortColumn, 'next', sortDirection)}
						</th>
					</tr>
				</thead>
				<tbody className="bg-card divide-y divide-border">
					{sortedStudents.map((student) => (
						<tr
							key={student.id}
							className="hover:bg-muted cursor-pointer transition-colors"
							onClick={() => onRowClick(student)}
						>
							<td className="px-6 py-4 whitespace-nowrap">
								<ClickAvatarPreview
									src={student.links.foto?.href || undefined}
									alt={`${student.roepnaam} ${student.achternaam}`}
									initials={`${student.roepnaam.charAt(0)}${student.achternaam.charAt(0)}`.toUpperCase()}
									className="h-14 w-14"
								/>
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-card-foreground">
								{student.roepnaam} {student.tussenvoegsel} {student.achternaam}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
								{student.klassen.join(', ')}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
								{student.lockerCode || '-'}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground max-w-32">
								<AgendaItemDisplay type="current" studentId={student.id} />
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground max-w-32">
								<AgendaItemDisplay
									type="next"
									studentId={student.id}
									lessonRange={nextLessonInfo.status === 'lesson' ? nextLessonInfo.range : undefined}
								/>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
