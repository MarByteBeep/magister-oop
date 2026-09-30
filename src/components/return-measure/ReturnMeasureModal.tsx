'use client';

import { LuTriangleAlert } from 'react-icons/lu';
import ReturnMeasureHandledDetails from '@/components/return-measure/ReturnMeasureHandledDetails';
import ReturnMeasureReportButtons from '@/components/return-measure/ReturnMeasureReportButtons';
import ReturnMeasureScheduleButton from '@/components/return-measure/ReturnMeasureScheduleButton';
import StudentItem from '@/components/student/StudentItem';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStudentAgendaFocus } from '@/context/StudentAgendaFocusContext';
import { useStudentsContext } from '@/context/StudentsContext';
import { useReturnMeasureReportOverlays } from '@/hooks/return-measure/useReturnMeasureReportOverlays';
import { returnMeasureIconClasses } from '@/lib/agenda/kindStyles';
import { returnMeasurePlanning, returnMeasureReportStatus } from '@/lib/return-measure/overview';
import { applyReturnMeasureReportOverlay } from '@/lib/return-measure/report';
import { getReturnMeasureDisplay } from '@/lib/return-measure/utils';
import { parseOptionalDate } from '@/lib/shared/dateUtils';
import { formatPersonName } from '@/lib/shared/stringUtils';
import { cn } from '@/lib/utils';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';
import type { Student } from '@/types/student.types';

interface ReturnMeasureModalProps {
	measure: ReturnMeasureStudent;
	isOpen: boolean;
	onClose: () => void;
	onOpenStudent?: (student: Student, options?: { tab?: 'gegevens' | 'agenda'; date?: Date }) => void;
}

export default function ReturnMeasureModal({
	measure: source,
	isOpen,
	onClose,
	onOpenStudent,
}: ReturnMeasureModalProps) {
	const reportOverlays = useReturnMeasureReportOverlays();
	const measure = applyReturnMeasureReportOverlay(source, reportOverlays);
	const { students } = useStudentsContext();
	const display = getReturnMeasureDisplay(measure);
	const start = parseOptionalDate(measure.begin);
	const measureTitle = display.primaryLabel || 'Terugkommaatregel';
	const details = measure.leerling;
	const studentName = formatPersonName(details.roepnaam, details.tussenvoegsel, details.achternaam);
	const student = students.find((item) => item.id === details.id);
	const agendaFocus = useStudentAgendaFocus();
	const canOpenAgenda = Boolean(start) && Boolean(agendaFocus || student);
	const planning = returnMeasurePlanning(measure);
	const reportStatus = returnMeasureReportStatus(measure);

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
					<StudentItem
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
					<p className="text-base font-medium text-foreground">{measureTitle}</p>
					<ReturnMeasureScheduleButton
						measure={measure}
						canOpenAgenda={canOpenAgenda}
						onOpenAgenda={openAgenda}
					/>
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

				<ReturnMeasureHandledDetails measure={measure} />

				{planning !== 'unplanned' && (
					<ReturnMeasureReportButtons
						measure={measure}
						reportStatus={reportStatus}
						student={student}
						studentName={studentName}
						classLabel={details.stamklas.code}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
