'use client';

import type { ApexOptions } from 'apexcharts';
import { useMemo } from 'react';
import Chart from 'react-apexcharts';
import type { LessonInfo } from '@/lib/agendaUtils';
import type { OccupancyChartPoint } from './useOccupancyChartData';

interface OccupancyChartProps {
	chartData: OccupancyChartPoint[];
	currentLessonInfo: LessonInfo;
	chartIsDark: boolean;
}

export default function OccupancyChart({ chartData, currentLessonInfo, chartIsDark }: OccupancyChartProps) {
	const activeLessonIndex = useMemo(() => {
		if (!currentLessonInfo.range || currentLessonInfo.status !== 'lesson') {
			return -1;
		}
		return chartData.findIndex((d) => d.lessonRange === currentLessonInfo.range);
	}, [chartData, currentLessonInfo]);

	const apexSeries = useMemo(
		() => [
			{ name: 'Leerlingen', data: chartData.map((d) => d.total) },
			{ name: 'Leerlingen met tussenuur', data: chartData.map((d) => d.breakTotal) },
		],
		[chartData],
	);

	const apexOptions: ApexOptions = useMemo(() => {
		const xLabelActive = chartIsDark ? '#fbbf24' : '#a16207';
		const xLabelDefault = chartIsDark ? '#e5e7eb' : '#4b5563';
		const gridBorder = chartIsDark ? '#374151' : '#e5e7eb';
		const nuLabelFg = chartIsDark ? '#fff' : '#1f2937';

		return {
			theme: { mode: chartIsDark ? 'dark' : 'light' },
			chart: {
				type: 'bar',
				stacked: true,
				toolbar: { show: false },
				zoom: { enabled: false },
				background: 'transparent',
				foreColor: chartIsDark ? '#e5e7eb' : '#374151',
				animations: { enabled: true, speed: 600 },
			},
			colors: ['#3b82f6', '#10b981'],
			xaxis: {
				categories: chartData.map((d) => d.lessonRange),
				labels: {
					style: {
						colors: chartData.map((_, index) =>
							index === activeLessonIndex ? xLabelActive : xLabelDefault,
						),
					},
				},
			},
			yaxis: {
				axisBorder: { show: true, color: gridBorder },
				axisTicks: { show: true, color: gridBorder },
				labels: { style: { colors: xLabelDefault } },
			},
			grid: { show: true, borderColor: gridBorder },
			legend: { labels: { colors: chartIsDark ? '#e5e7eb' : '#374151' } },
			annotations: {
				images: [],
				...(activeLessonIndex >= 0 && {
					xaxis: [
						{
							x: chartData[activeLessonIndex]?.lessonRange,
							borderColor: 'transparent',
							strokeDashArray: 0,
							borderWidth: 0,
							label: {
								borderColor: '#fbbf24',
								style: {
									color: nuLabelFg,
									background: '#fbbf24',
									fontSize: '12px',
									fontWeight: 'bold',
								},
								text: 'Nu',
								orientation: 'horizontal',
								position: 'top',
								offsetY: -10,
							},
						},
					],
				}),
			},
		};
	}, [chartData, activeLessonIndex, chartIsDark]);

	return (
		<div className="border rounded-lg p-4 bg-card shadow-sm h-[350px]">
			<h3 className="text-sm font-medium mb-3 text-muted-foreground">Totaal aantal leerlingen per lesblok</h3>
			<Chart
				key={`chart-${activeLessonIndex}-${chartData.length}`}
				options={apexOptions}
				series={apexSeries}
				type="bar"
				height={280}
			/>
		</div>
	);
}
