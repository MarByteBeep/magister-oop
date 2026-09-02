import { formatTime } from '@/lib/dateUtils';
import { isReturnMeasureAgendaItem } from '@/lib/returnMeasureUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';

export type FullDayScheduleConfig = {
	/** Local start time (HH:mm). Default school day start. */
	beginTime: string;
	/** Local end time (HH:mm). Default school day end. */
	endTime: string;
	/** Short UI label (Dutch product copy: "Vierkant rooster"). */
	label: string;
};

const DEFAULT_FULL_DAY_SCHEDULE_CONFIG: FullDayScheduleConfig = {
	beginTime: '08:00',
	endTime: '16:00',
	label: 'Vierkant rooster',
};

let fullDayScheduleConfig: FullDayScheduleConfig = { ...DEFAULT_FULL_DAY_SCHEDULE_CONFIG };

/** Override school-specific times/label later (e.g. from settings). */
export function configureFullDaySchedule(overrides: Partial<FullDayScheduleConfig>): void {
	fullDayScheduleConfig = {
		...fullDayScheduleConfig,
		...overrides,
	};
}

export function resetFullDayScheduleConfig(): void {
	fullDayScheduleConfig = { ...DEFAULT_FULL_DAY_SCHEDULE_CONFIG };
}

/**
 * Full-day return measure ("vierkant rooster"): student must be present the whole school day
 * (default 08:00–16:00). Times are configurable via {@link configureFullDaySchedule}.
 */
export function isFullDaySchedule(item: AgendaItem): boolean {
	if (!isReturnMeasureAgendaItem(item)) return false;
	const { beginTime, endTime } = fullDayScheduleConfig;
	return formatTime(new Date(item.begin)) === beginTime && formatTime(new Date(item.einde)) === endTime;
}

export function getFullDayScheduleLabel(): string {
	return fullDayScheduleConfig.label;
}
