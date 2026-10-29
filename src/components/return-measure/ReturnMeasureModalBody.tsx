import { LuTriangleAlert } from 'react-icons/lu';
import ReturnMeasureHandledDetails from '@/components/return-measure/ReturnMeasureHandledDetails';
import ReturnMeasureReportButtons from '@/components/return-measure/ReturnMeasureReportButtons';
import ReturnMeasureScheduleButton from '@/components/return-measure/ReturnMeasureScheduleButton';
import { returnMeasureIconClasses } from '@/lib/agenda/kindStyles';
import type { ReturnMeasurePlanning, ReturnMeasureReportStatus } from '@/lib/return-measure/overview';
import type { ReturnMeasureDisplay } from '@/lib/return-measure/utils';
import { cn } from '@/lib/utils';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';
import type { Student } from '@/types/student.types';

function ReturnMeasureModalDescription({ hasBoth, description }: { hasBoth: boolean; description: string | null }) {
	if (!hasBoth) return null;
	return (
		<div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">
			<LuTriangleAlert
				className={cn('mr-1 inline h-3.5 w-3.5 shrink-0 align-[-0.125em]', returnMeasureIconClasses)}
				aria-hidden
			/>
			{description}
		</div>
	);
}

export interface ReturnMeasureModalBodyProps {
	measure: ReturnMeasureStudent;
	measureTitle: string;
	display: ReturnMeasureDisplay;
	canOpenAgenda: boolean;
	onOpenAgenda: () => void;
	planning: ReturnMeasurePlanning;
	reportStatus: ReturnMeasureReportStatus;
	student: Student | undefined;
	studentName: string;
	classLabel: string;
}

function ReturnMeasureModalReportSection({
	measure,
	planning,
	reportStatus,
	student,
	studentName,
	classLabel,
}: Pick<
	ReturnMeasureModalBodyProps,
	'measure' | 'planning' | 'reportStatus' | 'student' | 'studentName' | 'classLabel'
>) {
	if (planning === 'unplanned') return null;
	return (
		<ReturnMeasureReportButtons
			measure={measure}
			reportStatus={reportStatus}
			student={student}
			studentName={studentName}
			classLabel={classLabel}
		/>
	);
}

export default function ReturnMeasureModalBody({
	measure,
	measureTitle,
	display,
	canOpenAgenda,
	onOpenAgenda,
	planning,
	reportStatus,
	student,
	studentName,
	classLabel,
}: ReturnMeasureModalBodyProps) {
	return (
		<>
			<div className="space-y-3">
				<p className="text-base font-medium text-foreground">{measureTitle}</p>
				<ReturnMeasureScheduleButton
					measure={measure}
					canOpenAgenda={canOpenAgenda}
					onOpenAgenda={onOpenAgenda}
				/>
				<ReturnMeasureModalDescription hasBoth={display.hasBoth} description={display.description} />
			</div>
			<ReturnMeasureHandledDetails measure={measure} />
			<ReturnMeasureModalReportSection
				measure={measure}
				planning={planning}
				reportStatus={reportStatus}
				student={student}
				studentName={studentName}
				classLabel={classLabel}
			/>
		</>
	);
}
