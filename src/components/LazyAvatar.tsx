'use client';
import { useEffect, useRef, useState } from 'react';
import Avatar from '@/components/ui/avatar';
import { getOrCreateBlobUrl } from '@/lib/blobUtils'; // Import from new utility
import { cn } from '@/lib/utils';

interface LazyAvatarProps {
	src?: string;
	alt: string;
	initials: string;
	className?: string;
}

export default function LazyAvatar({ src, alt, initials, className }: LazyAvatarProps) {
	const [isVisible, setIsVisible] = useState(false);
	const [blobUrl, setBlobUrl] = useState<string | undefined>();
	const avatarRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!avatarRef.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					setIsVisible(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.1 }, // 10% of component should be visible to trigger
		);

		observer.observe(avatarRef.current);

		return () => observer.disconnect();
	}, []);

	// Lazy load blob only when avatar is observed and src is available
	useEffect(() => {
		const currentSrc = src; // Capture src for cleanup
		if (!currentSrc) {
			setBlobUrl(undefined);
			return;
		}

		if (!isVisible) return;

		let cancelled = false;

		getOrCreateBlobUrl(currentSrc)
			.then((url) => {
				if (!cancelled) {
					setBlobUrl(url);
				}
			})
			.catch((err) => {
				console.error('Error loading avatar blob', err);
				if (!cancelled) {
					setBlobUrl(undefined);
				}
			});

		return () => {
			cancelled = true;
			// object URLs are managed by blobUtils cache, no need to revoke here
		};
	}, [src, isVisible]);
	return (
		<div
			ref={avatarRef}
			className={cn(
				'relative inline-block cursor-pointer p-0 border-none bg-transparent focus:outline-none',
				className,
			)}
		>
			<Avatar src={blobUrl} alt={alt} initials={initials} />
		</div>
	);
}
