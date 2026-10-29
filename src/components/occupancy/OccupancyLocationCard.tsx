import type { LessonInfo } from '@/lib/agenda/utils';
import { cn } from '@/lib/utils';

export interface OccupancyLocationCardProps {
	location: string;
	occupancyData: Record<string, number>;
	currentLessonInfo: LessonInfo;
	onCardClick: (location: string, lessonRange: string) => void;
}

const CELL_CLASSES = [
	'bg-primary/20 text-muted-foreground',
	'bg-muted/50 text-muted-foreground/70 border border-dashed',
	'bg-primary text-primary-foreground',
	'bg-green-600 text-primary-foreground',
] as const;

function lessonCellClass(isCurrentLesson: boolean, isFree: boolean): string {
	return CELL_CLASSES[Number(isCurrentLesson) * 2 + Number(isFree)];
}

function LessonCell({
	location,
	lessonRange,
	count,
	isCurrentLesson,
	onCardClick,
}: {
	location: string;
	lessonRange: string;
	count: number;
	isCurrentLesson: boolean;
	onCardClick: (location: string, lessonRange: string) => void;
}) {
	const isFree = count === 0;
	const label = ['Vrij', `${count}`][Number(!isFree)];

	return (
		<button
			type="button"
			className={cn(
				'p-1 rounded text-xs flex flex-col items-center justify-center cursor-pointer',
				lessonCellClass(isCurrentLesson, isFree),
			)}
			onClick={() => onCardClick(location, lessonRange)}
		>
			<span className="text-xs">{lessonRange}</span>
			<span className="font-medium text-sm">{label}</span>
		</button>
	);
}

export default function OccupancyLocationCard({
	location,
	occupancyData,
	currentLessonInfo,
	onCardClick,
}: OccupancyLocationCardProps) {
	return (
		<div className="border rounded-lg p-2 bg-card shadow-sm">
			<h3 className="text-md font-semibold mb-2">{location}</h3>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
				{Object.entries(occupancyData).map(([lessonRange, count]) => (
					<LessonCell
						key={`${location}-${lessonRange}`}
						location={location}
						lessonRange={lessonRange}
						count={count}
						isCurrentLesson={currentLessonInfo.range === lessonRange}
						onCardClick={onCardClick}
					/>
				))}
			</div>
		</div>
	);
}
