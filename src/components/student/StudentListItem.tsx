'use client';

import LazyAvatar from '@/components/LazyAvatar';
import type { Student } from '@/magister/types';

interface StudentListItemProps {
	student: Student;
	onClick?: (student: Student) => void;
	showClass?: boolean;
}

export default function StudentListItem({ student, onClick, showClass = false }: StudentListItemProps) {
	return (
		<button
			type="button"
			className="flex items-center gap-3 p-2 border rounded-md bg-muted/50 hover:bg-muted cursor-pointer text-left w-full"
			onClick={() => onClick?.(student)}
		>
			<LazyAvatar
				src={student.links.foto?.href || undefined}
				alt={`${student.roepnaam} ${student.achternaam}`}
				initials={`${student.roepnaam.charAt(0)}${student.achternaam.charAt(0)}`.toUpperCase()}
				className="h-10 w-10"
			/>
			<div className="flex flex-col">
				<span className="font-medium text-foreground">
					{student.roepnaam} {student.tussenvoegsel} {student.achternaam}
				</span>
				{showClass && <span className="text-xs text-muted-foreground">{student.klassen.join(', ')}</span>}
			</div>
		</button>
	);
}
