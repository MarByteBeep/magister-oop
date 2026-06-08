import type { LessonInfo } from '@/lib/agendaUtils';
import { cn } from '@/lib/utils';
import OccupancyChart from './OccupancyChart';
import type { OccupancyChartPoint } from './useOccupancyChartData';

interface OccupancyChartPanelProps {
	show: boolean;
	chartData: OccupancyChartPoint[];
	currentLessonInfo: LessonInfo;
	chartIsDark: boolean;
}

export default function OccupancyChartPanel({
	show,
	chartData,
	currentLessonInfo,
	chartIsDark,
}: OccupancyChartPanelProps) {
	return (
		<div
			className={cn(
				'overflow-hidden transition-all duration-300',
				show ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0',
			)}
		>
			<OccupancyChart chartData={chartData} currentLessonInfo={currentLessonInfo} chartIsDark={chartIsDark} />
		</div>
	);
}
