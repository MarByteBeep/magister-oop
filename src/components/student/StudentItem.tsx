'use client';

import type { MouseEvent } from 'react';
import LazyAvatar from '@/components/LazyAvatar';
import { formatPersonName, getInitials } from '@/lib/stringUtils';
import { cn } from '@/lib/utils';
import type { Student } from '@/magister/types';

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
	const displayName =
		name ?? (student ? formatPersonName(student.roepnaam, student.tussenvoegsel, student.achternaam) : '');
	const photo = photoUrl ?? student?.links.foto?.href;
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
		<>
			<LazyAvatar
				src={photo || undefined}
				alt={displayName}
				initials={getInitials(displayName)}
				className="h-10 w-10 shrink-0"
			/>
			<div className="flex min-w-0 flex-col">
				<span className="truncate font-medium text-foreground">
					{displayName}
					{classLabel ? <span className="font-normal text-muted-foreground"> ({classLabel})</span> : null}
				</span>
				{description ? <span className="truncate text-xs text-muted-foreground">{description}</span> : null}
			</div>
		</>
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
