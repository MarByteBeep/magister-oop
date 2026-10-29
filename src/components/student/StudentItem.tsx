'use client';

import type { MouseEvent, ReactNode } from 'react';
import StudentItemContent from '@/components/student/StudentItemContent';
import { formatPersonName } from '@/lib/shared/stringUtils';
import { cn } from '@/lib/utils';
import type { Student } from '@/types/student.types';

export interface StudentItemProps {
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

function resolveDisplayName(student: Student | undefined, name: string | undefined): string {
	if (name !== undefined) return name;
	if (!student) return '';
	return formatPersonName(student.roepnaam, student.tussenvoegsel, student.achternaam);
}

function studentFotoHref(student: Student): string | undefined {
	const foto = student.links.foto;
	if (!foto) return undefined;
	return foto.href;
}

function resolvePhoto(student: Student | undefined, photoUrl: string | undefined): string | undefined {
	if (photoUrl !== undefined) return photoUrl;
	if (!student) return undefined;
	return studentFotoHref(student);
}

function isStudentItemButton(onClick: StudentItemProps['onClick'], disabled: boolean): boolean {
	if (!onClick) return false;
	return !disabled;
}

function studentItemVariantClass(variant: 'card' | 'plain'): string {
	if (variant === 'card') return 'w-full rounded-md border bg-muted/50 p-2';
	return 'w-fit max-w-full rounded-md';
}

function studentItemClasses(variant: 'card' | 'plain', isButton: boolean, className: string | undefined): string {
	return cn(
		'flex items-center gap-3 text-left',
		studentItemVariantClass(variant),
		isButton &&
			'cursor-pointer hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
		className,
	);
}

function StudentItemShell({
	isButton,
	classes,
	displayName,
	onClick,
	content,
}: {
	isButton: boolean;
	classes: string;
	displayName: string;
	onClick: StudentItemProps['onClick'];
	content: ReactNode;
}) {
	if (!isButton) {
		return <div className={classes}>{content}</div>;
	}
	return (
		<button type="button" onClick={onClick} className={classes} aria-label={displayName}>
			{content}
		</button>
	);
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
	const displayName = resolveDisplayName(student, name);
	const photo = resolvePhoto(student, photoUrl);
	const isButton = isStudentItemButton(onClick, disabled);
	const classes = studentItemClasses(variant, isButton, className);
	const content = (
		<StudentItemContent displayName={displayName} photo={photo} classLabel={classLabel} description={description} />
	);

	return (
		<StudentItemShell
			isButton={isButton}
			classes={classes}
			displayName={displayName}
			onClick={onClick}
			content={content}
		/>
	);
}
