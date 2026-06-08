import { Skeleton } from '@/components/ui/skeleton';

const WEEKDAYS = ['ma', 'di', 'wo', 'do', 'vr'];

export default function WeeklyAgendaSkeleton() {
	return (
		<div className="space-y-2 p-5">
			<div className="flex items-center justify-between mb-2">
				<Skeleton className="h-8 w-8" />
				<Skeleton className="h-6 w-40" />
				<Skeleton className="h-8 w-8" />
			</div>
			<div className="flex gap-2">
				{WEEKDAYS.map((day) => (
					<Skeleton key={day} className="h-8 flex-1" />
				))}
			</div>
			<div className="flex gap-2">
				{WEEKDAYS.map((day) => (
					<Skeleton key={`content-${day}`} className="h-[400px] flex-1" />
				))}
			</div>
		</div>
	);
}
