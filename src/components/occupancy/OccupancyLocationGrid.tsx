import type { LessonInfo } from '@/lib/agendaUtils';
import OccupancyLocationCard from './OccupancyLocationCard';

interface OccupancyLocationGridProps {
	filteredLocations: string[];
	occupancyData: Record<string, Record<string, number>>;
	currentLessonInfo: LessonInfo;
	onCardClick: (location: string, lessonRange: string) => void;
}

export default function OccupancyLocationGrid({
	filteredLocations,
	occupancyData,
	currentLessonInfo,
	onCardClick,
}: OccupancyLocationGridProps) {
	if (filteredLocations.length === 0) {
		return (
			<p className="text-muted-foreground text-sm py-4 text-center">
				Selecteer één of meer lokalen in het filter om de bezetting per ruimte te zien.
			</p>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			{filteredLocations.map((location) => (
				<OccupancyLocationCard
					key={location}
					location={location}
					occupancyData={occupancyData[location]}
					currentLessonInfo={currentLessonInfo}
					onCardClick={onCardClick}
				/>
			))}
		</div>
	);
}
