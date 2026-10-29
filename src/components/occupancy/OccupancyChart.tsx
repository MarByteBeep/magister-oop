'use client';

import type { ApexOptions } from 'apexcharts';
import { useMemo } from 'react';
import Chart from 'react-apexcharts';
import type { LessonInfo } from '@/lib/agenda/utils';
import type { OccupancyChartPoint } from './useOccupancyChartData';

export interface OccupancyChartProps {
	chartData: OccupancyChartPoint[];
	currentLessonInfo: LessonInfo;
	chartIsDark: boolean;
	onLessonRangeClick: (lessonRange: string) => void;
}

type ChartTheme = {
	mode: 'dark' | 'light';
	xLabelActive: string;
	xLabelDefault: string;
	gridBorder: string;
	nuLabelFg: string;
	foreColor: string;
	legendColor: string;
};

const LIGHT_THEME: ChartTheme = {
	mode: 'light',
	xLabelActive: '#a16207',
	xLabelDefault: '#4b5563',
	gridBorder: '#e5e7eb',
	nuLabelFg: '#1f2937',
	foreColor: '#374151',
	legendColor: '#374151',
};

const DARK_THEME: ChartTheme = {
	mode: 'dark',
	xLabelActive: '#fbbf24',
	xLabelDefault: '#e5e7eb',
	gridBorder: '#374151',
	nuLabelFg: '#fff',
	foreColor: '#e5e7eb',
	legendColor: '#e5e7eb',
};

function chartTheme(isDark: boolean): ChartTheme {
	return [LIGHT_THEME, DARK_THEME][Number(isDark)];
}

function xAxisLabelColor(index: number, activeLessonIndex: number, theme: ChartTheme): string {
	return [theme.xLabelDefault, theme.xLabelActive][Number(index === activeLessonIndex)];
}

function nuAnnotation(
	activeLessonIndex: number,
	chartData: OccupancyChartPoint[],
	theme: ChartTheme,
): ApexOptions['annotations'] {
	const activePoint = chartData[activeLessonIndex];
	if (!activePoint) return { images: [] };

	return {
		images: [],
		xaxis: [
			{
				x: activePoint.lessonRange,
				borderColor: 'transparent',
				strokeDashArray: 0,
				borderWidth: 0,
				label: {
					borderColor: '#fbbf24',
					style: {
						color: theme.nuLabelFg,
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
	};
}

function buildApexOptions(
	chartData: OccupancyChartPoint[],
	activeLessonIndex: number,
	theme: ChartTheme,
	onLessonRangeClick: (lessonRange: string) => void,
): ApexOptions {
	return {
		theme: { mode: theme.mode },
		chart: {
			type: 'bar',
			stacked: true,
			toolbar: { show: false },
			zoom: { enabled: false },
			background: 'transparent',
			foreColor: theme.foreColor,
			animations: { enabled: false },
			events: {
				dataPointSelection: (_event, _chartContext, config) => {
					const lessonRange = chartData[config.dataPointIndex]?.lessonRange;
					if (lessonRange) onLessonRangeClick(lessonRange);
				},
			},
		},
		colors: ['#3b82f6', '#10b981'],
		xaxis: {
			categories: chartData.map((d) => d.lessonRange),
			labels: {
				style: {
					colors: chartData.map((_, index) => xAxisLabelColor(index, activeLessonIndex, theme)),
				},
			},
		},
		yaxis: {
			axisBorder: { show: true, color: theme.gridBorder },
			axisTicks: { show: true, color: theme.gridBorder },
			labels: { style: { colors: theme.xLabelDefault } },
		},
		grid: { show: true, borderColor: theme.gridBorder },
		legend: { labels: { colors: theme.legendColor } },
		annotations: nuAnnotation(activeLessonIndex, chartData, theme),
	};
}

export default function OccupancyChart({
	chartData,
	currentLessonInfo,
	chartIsDark,
	onLessonRangeClick,
}: OccupancyChartProps) {
	const activeLessonIndex = useMemo(() => {
		if (!currentLessonInfo.range || currentLessonInfo.status !== 'lesson') {
			return -1;
		}
		return chartData.findIndex((d) => d.lessonRange === currentLessonInfo.range);
	}, [chartData, currentLessonInfo]);

	const apexSeries = useMemo(
		() => [
			{ name: 'Leerlingen', data: chartData.map((d) => d.total) },
			{
				name: 'Leerlingen met tussenuur',
				data: chartData.map((d) => d.breakTotal),
			},
		],
		[chartData],
	);

	const apexOptions = useMemo(
		() => buildApexOptions(chartData, activeLessonIndex, chartTheme(chartIsDark), onLessonRangeClick),
		[chartData, activeLessonIndex, chartIsDark, onLessonRangeClick],
	);

	return (
		<div className="border rounded-lg p-4 bg-card shadow-sm h-[350px]">
			<h3 className="text-sm font-medium mb-3 text-muted-foreground">Totaal aantal leerlingen per lesblok</h3>
			<div className="cursor-pointer">
				<Chart
					key={`chart-${activeLessonIndex}-${chartData.length}`}
					options={apexOptions}
					series={apexSeries}
					type="bar"
					height={280}
				/>
			</div>
		</div>
	);
}
