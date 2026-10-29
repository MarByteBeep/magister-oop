import LazyAvatar from '@/components/LazyAvatar';
import { getInitials } from '@/lib/shared/stringUtils';

export interface StudentItemContentProps {
	displayName: string;
	photo: string | undefined;
	classLabel?: string;
	description?: string;
}

function ClassLabelSuffix({ classLabel }: { classLabel?: string }) {
	if (!classLabel) return null;
	return <span className="font-normal text-muted-foreground"> ({classLabel})</span>;
}

function DescriptionLine({ description }: { description?: string }) {
	if (!description) return null;
	return <span className="truncate text-xs text-muted-foreground">{description}</span>;
}

export default function StudentItemContent(props: StudentItemContentProps) {
	return (
		<>
			<LazyAvatar
				src={props.photo}
				alt={props.displayName}
				initials={getInitials(props.displayName)}
				className="h-10 w-10 shrink-0"
			/>
			<div className="flex min-w-0 flex-col">
				<span className="truncate font-medium text-foreground">
					{props.displayName}
					<ClassLabelSuffix classLabel={props.classLabel} />
				</span>
				<DescriptionLine description={props.description} />
			</div>
		</>
	);
}
