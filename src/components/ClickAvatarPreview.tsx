'use client';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import Avatar from '@/components/ui/avatar';
import { getOrCreateBlobUrl } from '@/lib/blobUtils'; // Import from new utility
import { cn } from '@/lib/utils';

interface ClickAvatarPreviewProps {
	src?: string;
	alt: string;
	initials: string;
	className?: string;
}

const ClickAvatarPreview: React.FC<ClickAvatarPreviewProps> = ({ src, alt, initials, className }) => {
	const [isVisible, setIsVisible] = useState(false);
	const [isShowingPreview, setIsShowingPreview] = useState(false);
	const [blobUrl, setBlobUrl] = useState<string | undefined>();
	const avatarRef = useRef<HTMLButtonElement>(null);
	const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({
		position: 'fixed',
		visibility: 'hidden',
		top: '50%',
		left: '50%',
		transform: 'translate(-50%, -50%)',
		zIndex: 9999,
	});

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

	// Position popover when showing preview
	useEffect(() => {
		if (isShowingPreview && avatarRef.current) {
			const rect = avatarRef.current.getBoundingClientRect();
			setPopoverStyle((prev) => ({
				...prev,
				top: rect.top + rect.height / 2,
				left: rect.left + rect.width / 2,
				visibility: 'visible',
			}));
		} else {
			setPopoverStyle((prev) => ({ ...prev, visibility: 'hidden' }));
		}
	}, [isShowingPreview]);

	const handleMouseDown = () => {
		if (blobUrl) setIsShowingPreview(true);
	};
	const handleMouseUp = () => {
		if (blobUrl) setIsShowingPreview(false);
	};
	const handleMouseLeave = () => {
		if (isShowingPreview) setIsShowingPreview(false);
	};

	return (
		<button
			ref={avatarRef}
			type="button"
			className={cn(
				'relative inline-block cursor-pointer p-0 border-none bg-transparent focus:outline-none',
				className,
			)}
			onMouseDown={handleMouseDown}
			onMouseUp={handleMouseUp}
			onMouseLeave={handleMouseLeave}
		>
			<Avatar src={blobUrl} alt={alt} initials={initials} className="h-14 w-14" />

			{isShowingPreview && blobUrl && (
				<div className="p-2 bg-card border border-border rounded-full shadow-lg" style={popoverStyle}>
					<div className="w-48 h-48 flex items-center justify-center rounded-full overflow-hidden">
						<img
							src={blobUrl}
							alt={`Grote versie van ${alt}`}
							className="w-full h-full object-cover"
							loading="lazy"
						/>
					</div>
				</div>
			)}
		</button>
	);
};

export default ClickAvatarPreview;
