'use client';

import type * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
	src?: string;
	alt: string;
	initials: string;
	className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, alt, initials, className }) => {
	return (
		<div className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted', className)}>
			{src ? (
				<img src={src} alt={alt} className="aspect-square h-full w-full object-cover" loading="lazy" />
			) : (
				<span className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
					{initials}
				</span>
			)}
		</div>
	);
};

export default Avatar;
