'use client';

import { useEffect, useMemo, useState } from 'react';
import LessonHourBadge from '@/components/LessonHourBadge';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useStudentsContext } from '@/context/StudentsContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { findAgendaItem, getAgendaItemInfo, timeTable } from '@/lib/agendaUtils';
import { formatTime, getDateKey, getNow } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import AgendaItemModal from './AgendaItemModal';
import AgendaTooltipContent from './AgendaTooltipContent';

interface DailyAgendaViewProps {
	studentId: number;
}

// Dynamically determine display start and end hours from timeTable
const firstLessonTime = timeTable[0].begin;
const lastLessonTime = timeTable[timeTable.length - 1].einde;

const DISPLAY_START_HOUR = parseInt(firstLessonTime.split(':')[0], 10);
const DISPLAY_END_HOUR = parseInt(lastLessonTime.split(':')[0], 10);

const TOTAL_DISPLAY_MINUTES = (DISPLAY_END_HOUR - DISPLAY_START_HOUR) * 60;
const SCHEDULE_HEIGHT_PX = 420;
const PIXELS_PER_MINUTE = SCHEDULE_HEIGHT_PX / TOTAL_DISPLAY_MINUTES;

export default function DailyAgendaView({ studentId }: DailyAgendaViewProps) {
	const currentTime = useCurrentTime();

	const { students, loadAgendaForStudent } = useStudentsContext();
	const student = students.find((s) => s.id === studentId);

	const todayKey = useMemo(() => getDateKey(currentTime), [currentTime]);
	const agendaFromContext = student?.agenda?.[todayKey];

	const [bootstrapAgenda, setBootstrapAgenda] = useState<AgendaItem[] | undefined>(undefined);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);

	useEffect(() => {
		if (!student) {
			setBootstrapAgenda(undefined);
			setIsLoading(false);
			return;
		}

		if (student.agenda?.[todayKey] !== undefined) {
			setBootstrapAgenda(undefined);
			setIsLoading(false);
			return;
		}

		let cancelled = false;
		setIsLoading(true);
		const now = getNow();
		loadAgendaForStudent(student.id, now, now)
			.then(({ items }) => {
				if (!cancelled) setBootstrapAgenda(items);
			})
			.catch((err) => console.error('Failed to load agenda:', err))
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [student, student?.agenda, todayKey, loadAgendaForStudent]);

	const agendaItems: AgendaItem[] | undefined = agendaFromContext !== undefined ? agendaFromContext : bootstrapAgenda;

	const activeAgendaItem = findAgendaItem(currentTime, agendaItems || []);

	if (isLoading) {
		return (
			<div className="space-y-2 p-5">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
		);
	}

	if (!agendaItems || agendaItems.length === 0) {
		return <p className="text-muted-foreground text-center py-4">Geen lessen gepland voor vandaag.</p>;
	}

	// Sorteer agendapunten op hun begintijd
	const sortedAgendaItems = [...agendaItems].sort(
		(a, b) => new Date(a.begin).getTime() - new Date(b.begin).getTime(),
	);

	const hourlySlots = Array.from({ length: DISPLAY_END_HOUR - DISPLAY_START_HOUR + 1 }, (_, i) => {
		const hour = DISPLAY_START_HOUR + i;
		return `${String(hour).padStart(2, '0')}:00`;
	});

	const calculateItemStyle = (item: AgendaItem) => {
		const itemStart = new Date(item.begin);
		const itemEnd = new Date(item.einde);

		const startMinutes = itemStart.getHours() * 60 + itemStart.getMinutes();
		const endMinutes = itemEnd.getHours() * 60 + itemEnd.getMinutes();
		const displayStartMinutes = DISPLAY_START_HOUR * 60;

		const top = (startMinutes - displayStartMinutes) * PIXELS_PER_MINUTE;
		const height = (endMinutes - startMinutes) * PIXELS_PER_MINUTE;

		return {
			top: `${top}px`,
			height: `${height}px`,
		};
	};

	return (
		<>
			<ScrollArea className="pr-2 h-[480px]">
				<div className={`relative flex pt-2 h-[${SCHEDULE_HEIGHT_PX}px]`}>
					<div className="w-16 text-right pr-2 text-xs text-muted-foreground shrink-0">
						{hourlySlots.map((time, index) => (
							<div
								key={time}
								className="relative"
								style={{
									height: index < hourlySlots.length - 1 ? `${60 * PIXELS_PER_MINUTE}px` : 'auto',
								}}
							>
								{time}
							</div>
						))}
					</div>

					<div className="relative flex-1 border-l border-border">
						{Array.from({ length: TOTAL_DISPLAY_MINUTES / 30 }, (_, i) => {
							const minutesOffset = (i + 1) * 30; // 30, 60, 90, ...
							const topPosition = minutesOffset * PIXELS_PER_MINUTE;
							const isFullHour = minutesOffset % 60 === 0;

							return (
								<div
									key={`time-line-${minutesOffset}`}
									className={cn(
										'absolute left-0 right-0 border-t-2 border-border/50',
										isFullHour ? '' : 'border-dashed',
									)}
									style={{ top: `${topPosition}px` }}
								/>
							);
						})}

						{sortedAgendaItems.map((item) => {
							const isCurrent = activeAgendaItem?.id === item.id;
							const beginTime = new Date(item.begin);
							const endTime = new Date(item.einde);
							const itemStyle = calculateItemStyle(item);
							const { locations, courseCodes, subject } = getAgendaItemInfo(item);

							return (
								<Tooltip key={item.id}>
									<TooltipTrigger asChild>
										<button
											type="button"
											className={cn(
												'absolute left-1 right-1 px-1 py-0.5 rounded-md border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-shadow text-left',
												isCurrent
													? 'bg-card-foreground/30 border-primary'
													: 'bg-card border-primary/50',
											)}
											style={itemStyle}
											onClick={() => setSelectedItem(item)}
										>
											{isCurrent && (
												<Badge
													variant="default"
													className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs px-1 py-0.5"
												>
													Nu
												</Badge>
											)}
											{/* FIXME: Support multiple hours, e.g.: 7-8 */}
											<div className="flex items-center gap-1 text-xs font-light text-foreground">
												{item.lesuur?.begin && (
													<LessonHourBadge
														lessonInfo={{ status: 'lesson', lesson: item.lesuur.begin }}
														className="h-4 w-4 text-[0.6rem]"
													/>
												)}
												<span className="truncate">
													{formatTime(beginTime)} - {formatTime(endTime)}
												</span>
												<span className="font-semibold text-sm truncate ml-1">
													{courseCodes ?? subject}
												</span>
												<span className="font-extralight text-sm truncate ml-1">
													{locations ? `(${locations})` : ''}
												</span>
											</div>
										</button>
									</TooltipTrigger>
									<TooltipContent>
										<AgendaTooltipContent item={item} />
									</TooltipContent>
								</Tooltip>
							);
						})}
					</div>
				</div>
			</ScrollArea>

			{selectedItem && (
				<AgendaItemModal
					item={selectedItem}
					isOpen={selectedItem !== null}
					onClose={() => setSelectedItem(null)}
				/>
			)}
		</>
	);
}
