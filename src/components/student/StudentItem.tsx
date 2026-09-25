'use client';

import type { MouseEvent } from 'react';
import StudentItemContent from '@/components/student/StudentItemContent';
import { formatPersonName } from '@/lib/stringUtils';
import { cn } from '@/lib/utils';
import type { Student } from '@/types/student.types';

interface StudentItemProps {
	student?: Student;
	name?: string;
	photoUrl?: string;
	classLabel?: string;
	description?: string;
	onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
	disabled?: boolean;
	variant?: 'card' | 'plain';
	className?: string;
}

function resolveStudentItemDisplay(
	student: Student | undefined,
	name: string | undefined,
	photoUrl: string | undefined,
): { displayName: string; photo: string | undefined } {
	const displayName =
		name ?? (student ? formatPersonName(student.roepnaam, student.tussenvoegsel, student.achternaam) : '');
	const photo = photoUrl ?? student?.links.foto?.href;
	return { displayName, photo };
}

export default function StudentItem({
	student,
	name,
	photoUrl,
	classLabel,
	description,
	onClick,
	disabled = false,
	variant = 'card',
	className,
}: StudentItemProps) {
	const { displayName, photo } = resolveStudentItemDisplay(student, name, photoUrl);
	const isButton = Boolean(onClick) && !disabled;
	const classes = cn(
		'flex items-center gap-3 text-left',
		variant === 'card' && 'w-full rounded-md border bg-muted/50 p-2',
		variant === 'plain' && 'w-fit max-w-full rounded-md',
		isButton &&
			'cursor-pointer hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
		className,
	);

	const content = (
		<StudentItemContent displayName={displayName} photo={photo} classLabel={classLabel} description={description} />
	);

	if (!isButton) {
		return <div className={classes}>{content}</div>;
	}

	return (
		<button type="button" onClick={onClick} className={classes} aria-label={displayName}>
			{content}
		</button>
	);
}
