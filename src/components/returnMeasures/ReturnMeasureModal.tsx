'use client';

import { LuCalendar, LuClock, LuTriangleAlert, LuUser } from 'react-icons/lu';
import ReturnMeasureStatusBadges from '@/components/returnMeasures/ReturnMeasureStatusBadges';
import StudentListItem from '@/components/student/StudentListItem';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStudentAgendaFocus } from '@/context/StudentAgendaFocusContext';
import { useStudentsContext } from '@/context/StudentsContext';
import { returnMeasureIconClasses } from '@/lib/agendaKindStyles';
import { formatDayLabel } from '@/lib/dateLabels';
import { formatTime, parseOptionalDate } from '@/lib/dateUtils';
import { returnMeasurePlanning, returnMeasureReportStatus } from '@/lib/returnMeasureOverview';
import { getReturnMeasureDisplay } from '@/lib/returnMeasureUtils';
import { formatPersonName } from '@/lib/stringUtils';
import { cn } from '@/lib/utils';
import type { ReturnMeasureStudent } from '@/magister/response/return-measure.types';
import type { Student } from '@/magister/types';

interface ReturnMeasureModalProps {
	measure: ReturnMeasureStudent;
	isOpen: boolean;
	onClose: () => void;
	onOpenStudent?: (student: Student, options?: { tab?: 'gegevens' | 'agenda'; date?: Date }) => void;
}

function formatTimeRange(measure: ReturnMeasureStudent): string | null {
	const start = parseOptionalDate(measure.begin);
	const end = parseOptionalDate(measure.einde);
	if (!start || !end) return null;
	return `${formatTime(start)} - ${formatTime(end)}`;
}

function handlerName(measure: ReturnMeasureStudent): string | null {
	const handler = measure.afgehandeldDoor;
	if (!handler) return null;
	return formatPersonName(handler.roepnaam, handler.tussenvoegsel, handler.achternaam);
}

export default function ReturnMeasureModal({ measure, isOpen, onClose, onOpenStudent }: ReturnMeasureModalProps) {
	const { students } = useStudentsContext();
	const display = getReturnMeasureDisplay(measure);
	const start = parseOptionalDate(measure.begin);
	const timeRange = formatTimeRange(measure);
	const dateLabel = start ? formatDayLabel(start) : null;
	const handledBy = handlerName(measure);
	const measureTitle = display.primaryLabel || 'Terugkommaatregel';
	const details = measure.leerling;
	const studentName = formatPersonName(details.roepnaam, details.tussenvoegsel, details.achternaam);
	const student = students.find((item) => item.id === details.id);
	const agendaFocus = useStudentAgendaFocus();
	const canOpenAgenda = Boolean(start) && Boolean(agendaFocus || student);

	function openAgenda() {
		if (!start) return;
		if (agendaFocus) {
			agendaFocus(start);
			onClose();
			return;
		}
		if (student) {
			onOpenStudent?.(student, { tab: 'agenda', date: start });
			onClose();
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-[800px]">
				<DialogHeader className="pr-8">
					<DialogTitle className="sr-only">{studentName}</DialogTitle>
					<StudentListItem
						student={student}
						name={studentName}
						photoUrl={student?.links.foto?.href || details.links.foto?.href}
						classLabel={details.stamklas.code}
						variant="plain"
						className="p-2"
						onClick={
							student && onOpenStudent
								? () => {
										onOpenStudent(student);
									}
								: undefined
						}
					/>
				</DialogHeader>

				<div className="space-y-3">
					<div className="flex flex-wrap items-center gap-2">
						<p className="text-base font-medium text-foreground">{measureTitle}</p>
						<ReturnMeasureStatusBadges
							reportStatus={returnMeasureReportStatus(measure)}
							planning={returnMeasurePlanning(measure)}
						/>
					</div>

					<button
						type="button"
						disabled={!canOpenAgenda}
						className={cn(
							'flex w-fit max-w-full flex-wrap items-center gap-4 rounded-md p-2 text-sm text-left outline-none',
							'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
							canOpenAgenda ? 'cursor-pointer hover:bg-muted' : 'cursor-default',
						)}
						onClick={openAgenda}
						aria-label={dateLabel ? `Open rooster op ${dateLabel}` : undefined}
					>
						{dateLabel && (
							<span className="flex items-center gap-1.5 text-muted-foreground">
								<LuCalendar className="h-4 w-4" />
								<span className="font-medium text-foreground">{dateLabel}</span>
							</span>
						)}
						<span className="flex items-center gap-1.5 text-muted-foreground">
							<LuClock className="h-4 w-4" />
							<span className="font-medium text-foreground">{timeRange ?? 'Nog niet ingepland'}</span>
						</span>
					</button>
					{handledBy && (
						<div className="flex items-center gap-1.5 px-2 text-sm text-muted-foreground">
							<LuUser className="h-4 w-4" />
							<span className="font-medium text-foreground">{handledBy}</span>
						</div>
					)}

					{display.hasBoth && (
						<div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">
							<LuTriangleAlert
								className={cn(
									'mr-1 inline h-3.5 w-3.5 shrink-0 align-[-0.125em]',
									returnMeasureIconClasses,
								)}
								aria-hidden
							/>
							{display.description}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
