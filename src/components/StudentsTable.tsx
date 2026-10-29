import ClickAvatarPreview from '@/components/ClickAvatarPreview';
import LessonHourBadge from '@/components/student/agenda/calendar/LessonHourBadge';
import AgendaItemDisplay from '@/components/student/agenda/display/AgendaItemDisplay';
import type { SortColumn, SortDirection } from '@/hooks/students/useStudentListFilters';
import type { LessonInfo } from '@/lib/agenda/utils';
import type { Student } from '@/types/student.types';

export interface StudentsTableProps {
	sortedStudents: Student[];
	filteredCount: number;
	sortColumn: SortColumn;
	sortDirection: SortDirection;
	currentLessonInfo: LessonInfo;
	nextLessonInfo: LessonInfo;
	onSort: (column: SortColumn) => void;
	onRowClick: (student: Student) => void;
}

const SORT_INDICATORS = ['', ' ▲', ' ▼'] as const;

function getSortIndicator(sortColumn: SortColumn, column: SortColumn, sortDirection: SortDirection) {
	if (sortColumn !== column) return SORT_INDICATORS[0];
	return SORT_INDICATORS[1 + Number(sortDirection === 'desc')];
}

function LessonRangeHeader({ lessonInfo, badgeClassName }: { lessonInfo: LessonInfo; badgeClassName?: string }) {
	return (
		<div className="flex items-center justify-center gap-1">
			<LessonHourBadgeIfPresent lessonInfo={lessonInfo} className={badgeClassName} />
			<span>{lessonRangeLabel(lessonInfo)}</span>
		</div>
	);
}

function lessonRangeLabel(lessonInfo: LessonInfo): string {
	if (lessonInfo.range) return lessonInfo.range;
	return 'Geen les';
}

function LessonHourBadgeIfPresent({ lessonInfo, className }: { lessonInfo: LessonInfo; className?: string }) {
	if (!lessonInfo.lesson) return null;
	return <LessonHourBadge lessonInfo={lessonInfo} className={className} />;
}

function nextLessonRange(nextLessonInfo: LessonInfo): string | undefined {
	if (nextLessonInfo.status !== 'lesson') return undefined;
	return nextLessonInfo.range;
}

function studentPhotoSrc(student: Student): string | undefined {
	const foto = student.links.foto;
	if (!foto) return undefined;
	return foto.href;
}

function lockerDisplay(lockerCode: string | null | undefined): string {
	if (!lockerCode) return '-';
	return lockerCode;
}

function StudentsTableHeader({
	sortedStudents,
	filteredCount,
	sortColumn,
	sortDirection,
	currentLessonInfo,
	nextLessonInfo,
	onSort,
}: Omit<StudentsTableProps, 'onRowClick'>) {
	return (
		<thead className="bg-muted text-xs font-medium text-muted-foreground uppercase tracking-wider text-center cursor-pointer">
			<tr>
				<th className="text-center">
					{sortedStudents.length} van {filteredCount}
				</th>
				<th scope="col" onClick={() => onSort('name')} className="px-6 py-3">
					Naam{getSortIndicator(sortColumn, 'name', sortDirection)}
				</th>
				<th scope="col" onClick={() => onSort('class')}>
					Klas{getSortIndicator(sortColumn, 'class', sortDirection)}
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
					<LessonRangeHeader lessonInfo={currentLessonInfo} />
					{getSortIndicator(sortColumn, 'now', sortDirection)}
				</th>
				<th scope="col" className="px-6 py-3 w-34" onClick={() => onSort('next')}>
					<LessonRangeHeader lessonInfo={nextLessonInfo} badgeClassName="bg-primary/40" />
					{getSortIndicator(sortColumn, 'next', sortDirection)}
				</th>
			</tr>
		</thead>
	);
}

function StudentTableRow({
	student,
	nextLessonInfo,
	onRowClick,
}: {
	student: Student;
	nextLessonInfo: LessonInfo;
	onRowClick: (student: Student) => void;
}) {
	return (
		<tr className="hover:bg-muted cursor-pointer transition-colors" onClick={() => onRowClick(student)}>
			<td className="px-6 py-4 whitespace-nowrap">
				<ClickAvatarPreview
					src={studentPhotoSrc(student)}
					alt={`${student.roepnaam} ${student.achternaam}`}
					initials={`${student.roepnaam.charAt(0)}${student.achternaam.charAt(0)}`.toUpperCase()}
					className="h-14 w-14"
				/>
			</td>
			<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-card-foreground">
				{student.roepnaam} {student.tussenvoegsel} {student.achternaam}
			</td>
			<td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{student.klassen.join(', ')}</td>
			<td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
				{lockerDisplay(student.lockerCode)}
			</td>
			<td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground max-w-32">
				<AgendaItemDisplay type="current" studentId={student.id} />
			</td>
			<td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground max-w-32">
				<AgendaItemDisplay type="next" studentId={student.id} lessonRange={nextLessonRange(nextLessonInfo)} />
			</td>
		</tr>
	);
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
				<StudentsTableHeader
					sortedStudents={sortedStudents}
					filteredCount={filteredCount}
					sortColumn={sortColumn}
					sortDirection={sortDirection}
					currentLessonInfo={currentLessonInfo}
					nextLessonInfo={nextLessonInfo}
					onSort={onSort}
				/>
				<tbody className="bg-card divide-y divide-border">
					{sortedStudents.map((student) => (
						<StudentTableRow
							key={student.id}
							student={student}
							nextLessonInfo={nextLessonInfo}
							onRowClick={onRowClick}
						/>
					))}
				</tbody>
			</table>
		</div>
	);
}
