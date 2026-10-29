import { useStudentAgendaFocus } from '@/context/StudentAgendaFocusContext';
import { useStudentsContext } from '@/context/StudentsContext';
import { useReturnMeasureReportOverlays } from '@/hooks/return-measure/useReturnMeasureReportOverlays';
import { returnMeasurePlanning, returnMeasureReportStatus } from '@/lib/return-measure/overview';
import { applyReturnMeasureReportOverlay } from '@/lib/return-measure/report';
import type { ReturnMeasureDisplay } from '@/lib/return-measure/utils';
import { getReturnMeasureDisplay } from '@/lib/return-measure/utils';
import { parseOptionalDate } from '@/lib/shared/dateUtils';
import { formatPersonName } from '@/lib/shared/stringUtils';
import type { ReturnMeasureStudent } from '@/magister/response/returnMeasure.types';
import type { Student } from '@/types/student.types';

export type OpenStudent = (student: Student, options?: { tab?: 'gegevens' | 'agenda'; date?: Date }) => void;

function hrefOfFoto(foto: { href: string } | undefined): string | undefined {
	if (!foto) return undefined;
	return foto.href;
}

function measureModalTitle(display: ReturnMeasureDisplay): string {
	if (display.primaryLabel) return display.primaryLabel;
	return 'Terugkommaatregel';
}

function measureModalPhotoUrl(
	student: Student | undefined,
	details: ReturnMeasureStudent['leerling'],
): string | undefined {
	const fromStudent = student ? hrefOfFoto(student.links.foto) : undefined;
	if (fromStudent !== undefined) return fromStudent;
	return hrefOfFoto(details.links.foto);
}

function findStudentById(students: Student[], id: number): Student | undefined {
	return students.find((item) => item.id === id);
}

function canOpenReturnMeasureAgenda(
	start: Date | null,
	agendaFocus: ((date: Date) => void) | null | undefined,
	student: Student | undefined,
): boolean {
	if (!start) return false;
	return Boolean(agendaFocus || student);
}

function tryFocusAgenda(
	start: Date,
	agendaFocus: ((date: Date) => void) | null | undefined,
	onClose: () => void,
): boolean {
	if (!agendaFocus) return false;
	agendaFocus(start);
	onClose();
	return true;
}

function tryOpenStudentAgenda(
	start: Date,
	student: Student | undefined,
	onOpenStudent: OpenStudent | undefined,
	onClose: () => void,
): void {
	if (!student) return;
	onOpenStudent?.(student, { tab: 'agenda', date: start });
	onClose();
}

function openReturnMeasureAgenda(args: {
	start: Date | null;
	agendaFocus: ((date: Date) => void) | null | undefined;
	student: Student | undefined;
	onOpenStudent?: OpenStudent;
	onClose: () => void;
}): void {
	const { start, agendaFocus, student, onOpenStudent, onClose } = args;
	if (!start) return;
	if (tryFocusAgenda(start, agendaFocus, onClose)) return;
	tryOpenStudentAgenda(start, student, onOpenStudent, onClose);
}

export function useReturnMeasureModal(source: ReturnMeasureStudent, onClose: () => void, onOpenStudent?: OpenStudent) {
	const reportOverlays = useReturnMeasureReportOverlays();
	const measure = applyReturnMeasureReportOverlay(source, reportOverlays);
	const { students } = useStudentsContext();
	const display = getReturnMeasureDisplay(measure);
	const start = parseOptionalDate(measure.begin);
	const details = measure.leerling;
	const student = findStudentById(students, details.id);
	const agendaFocus = useStudentAgendaFocus();

	return {
		measure,
		display,
		measureTitle: measureModalTitle(display),
		student,
		studentName: formatPersonName(details.roepnaam, details.tussenvoegsel, details.achternaam),
		photoUrl: measureModalPhotoUrl(student, details),
		classLabel: details.stamklas.code,
		canOpenAgenda: canOpenReturnMeasureAgenda(start, agendaFocus, student),
		openAgenda: () => openReturnMeasureAgenda({ start, agendaFocus, student, onOpenStudent, onClose }),
		planning: returnMeasurePlanning(measure),
		reportStatus: returnMeasureReportStatus(measure),
	};
}
