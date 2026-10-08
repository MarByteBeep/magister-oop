'use client';

import { type RefObject, useRef } from 'react';
import { FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';
import NewAppointmentAbsenceReasonField from '@/components/student/agenda/NewAppointmentAbsenceReasonField';
import { DateAndTimeRangePicker } from '@/components/ui/date-and-time-range-picker';
import { Field } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getAttendanceType } from '@/lib/absence-notice/attendanceTypes';
import type { AttendanceType } from '@/magister/response/attendanceType.types';

interface NewAppointmentAbsenceFormProps {
	dateKey: string;
	startTime: string;
	endTime: string;
	attendanceTypes: AttendanceType[];
	attendanceTypeCode: string;
	comment: string;
	internalComment: string;
	onDateKeyChange: (value: string) => void;
	onStartTimeChange: (value: string) => void;
	onEndTimeChange: (value: string) => void;
	onAttendanceTypeCodeChange: (value: string) => void;
	onCommentChange: (value: string) => void;
	onInternalCommentChange: (value: string) => void;
	reasonRef: RefObject<HTMLInputElement | null>;
	popoverContainer?: HTMLElement | null;
	onDatePickerOpenChange?: (open: boolean) => void;
	onReasonComboboxOpenChange?: (open: boolean) => void;
}

export default function NewAppointmentAbsenceForm({
	dateKey,
	startTime,
	endTime,
	attendanceTypes,
	attendanceTypeCode,
	comment,
	internalComment,
	onDateKeyChange,
	onStartTimeChange,
	onEndTimeChange,
	onAttendanceTypeCodeChange,
	onCommentChange,
	onInternalCommentChange,
	reasonRef,
	popoverContainer,
	onDatePickerOpenChange,
	onReasonComboboxOpenChange,
}: NewAppointmentAbsenceFormProps) {
	const commentRef = useRef<HTMLTextAreaElement>(null);
	const selectedType = getAttendanceType(attendanceTypeCode);
	const commentOptional = !selectedType?.commentMandatory;

	const handleReasonSelect = (type: AttendanceType | null) => {
		onAttendanceTypeCodeChange(type?.code ?? '');
		if (!type) return;
		requestAnimationFrame(() => {
			commentRef.current?.focus();
		});
	};

	return (
		<div className="space-y-4">
			<DateAndTimeRangePicker
				dateKey={dateKey}
				startTime={startTime}
				endTime={endTime}
				onDateKeyChange={onDateKeyChange}
				onStartTimeChange={onStartTimeChange}
				onEndTimeChange={onEndTimeChange}
				dateId="absence-date"
				startTimeId="absence-start-time"
				endTimeId="absence-end-time"
				popoverContainer={popoverContainer}
				onDatePickerOpenChange={onDatePickerOpenChange}
			/>

			<NewAppointmentAbsenceReasonField
				attendanceTypes={attendanceTypes}
				selectedType={selectedType}
				onSelect={handleReasonSelect}
				reasonRef={reasonRef}
				popoverContainer={popoverContainer}
				onOpenChange={onReasonComboboxOpenChange}
			/>

			<Field>
				<Label htmlFor="absence-comment">Toelichting{commentOptional ? '' : ' *'}</Label>
				<p className="flex gap-2 text-sm text-muted-foreground">
					<FaExclamationCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
					<span>
						Deel hier geen privacygevoelige informatie. Deze toelichting is zichtbaar voor ouders en
						leerlingen.
					</span>
				</p>
				<Textarea
					ref={commentRef}
					id="absence-comment"
					value={comment}
					onChange={(event) => onCommentChange(event.target.value)}
					rows={3}
					className="focus-visible:ring-0 focus-visible:ring-offset-0"
				/>
			</Field>

			<Field>
				<Label htmlFor="absence-internal-comment">Toelichting intern</Label>
				<p className="flex gap-2 text-sm text-muted-foreground">
					<FaInfoCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
					<span>Alléén zichtbaar voor personeel.</span>
				</p>
				<Textarea
					id="absence-internal-comment"
					value={internalComment}
					onChange={(event) => onInternalCommentChange(event.target.value)}
					rows={3}
					className="focus-visible:ring-0 focus-visible:ring-offset-0"
				/>
			</Field>
		</div>
	);
}
