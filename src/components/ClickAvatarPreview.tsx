'use client';
import type React from 'react';
import { useEffect, useState } from 'react';
import Avatar from '@/components/ui/avatar';
import { useLazyBlobUrl } from '@/hooks/useLazyBlobUrl';
import { cn } from '@/lib/utils';

interface ClickAvatarPreviewProps {
	src?: string;
	alt: string;
	initials: string;
	className?: string;
}

const ClickAvatarPreview: React.FC<ClickAvatarPreviewProps> = ({ src, alt, initials, className }) => {
	const { blobUrl, elementRef } = useLazyBlobUrl<HTMLButtonElement>(src);
	const [isShowingPreview, setIsShowingPreview] = useState(false);
	const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({
		position: 'fixed',
		visibility: 'hidden',
		top: '50%',
		left: '50%',
		transform: 'translate(-50%, -50%)',
		zIndex: 9999,
	});

	useEffect(() => {
		const element = elementRef.current;
		if (isShowingPreview && element) {
			const rect = element.getBoundingClientRect();
			setPopoverStyle((prev) => ({
				...prev,
				top: rect.top + rect.height / 2,
				left: rect.left + rect.width / 2,
				visibility: 'visible',
			}));
		} else {
			setPopoverStyle((prev) => ({ ...prev, visibility: 'hidden' }));
		}
	}, [isShowingPreview, elementRef]);

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
			ref={elementRef}
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
