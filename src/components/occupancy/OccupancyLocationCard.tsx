import type { LessonInfo } from '@/lib/agendaUtils';
import { cn } from '@/lib/utils';

interface OccupancyLocationCardProps {
	location: string;
	occupancyData: Record<string, number>;
	currentLessonInfo: LessonInfo;
	onCardClick: (location: string, lessonRange: string) => void;
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
				{Object.entries(occupancyData).map(([lessonRange, count]) => {
					const isCurrentLesson = currentLessonInfo.range === lessonRange;
					const isFree = count === 0;

					return (
						<button
							type="button"
							key={`${location}-${lessonRange}`}
							className={cn(
								'p-1 rounded text-xs flex flex-col items-center justify-center cursor-pointer',
								isCurrentLesson && !isFree && 'bg-primary text-primary-foreground',
								isCurrentLesson && isFree && 'bg-green-600 text-primary-foreground',
								!isCurrentLesson &&
									isFree &&
									'bg-muted/50 text-muted-foreground/70 border border-dashed',
								!isCurrentLesson && !isFree && 'bg-primary/20 text-muted-foreground',
							)}
							onClick={() => onCardClick(location, lessonRange)}
						>
							<span className="text-xs">{lessonRange}</span>
							<span className="font-medium text-sm">{isFree ? 'Vrij' : `${count}`}</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
