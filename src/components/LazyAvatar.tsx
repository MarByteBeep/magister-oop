'use client';
import Avatar from '@/components/ui/avatar';
import { useLazyBlobUrl } from '@/hooks/useLazyBlobUrl';
import { cn } from '@/lib/utils';

interface LazyAvatarProps {
	src?: string;
	alt: string;
	initials: string;
	className?: string;
}

export default function LazyAvatar({ src, alt, initials, className }: LazyAvatarProps) {
	const { blobUrl, elementRef } = useLazyBlobUrl<HTMLDivElement>(src);

	return (
		<div
			ref={elementRef}
			className={cn('relative inline-block p-0 border-none bg-transparent focus:outline-none', className)}
		>
			<Avatar src={blobUrl} alt={alt} initials={initials} />
		</div>
	);
}
