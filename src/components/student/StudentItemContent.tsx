import LazyAvatar from '@/components/LazyAvatar';
import { getInitials } from '@/lib/stringUtils';

interface StudentItemContentProps {
	displayName: string;
	photo: string | undefined;
	classLabel?: string;
	description?: string;
}

export default function StudentItemContent({ displayName, photo, classLabel, description }: StudentItemContentProps) {
	return (
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
}
