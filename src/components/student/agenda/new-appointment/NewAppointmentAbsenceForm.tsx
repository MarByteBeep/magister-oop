'use client';

import { type RefObject, useRef } from 'react';
import { FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';
import NewAppointmentAbsenceReasonField from '@/components/student/agenda/new-appointment/NewAppointmentAbsenceReasonField';
import { DateAndTimeRangePicker } from '@/components/ui/date-and-time-range-picker';
import { Field } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getAttendanceType } from '@/lib/absence-notice/attendanceTypes';
import type { AttendanceType } from '@/magister/response/attendanceType.types';

export interface NewAppointmentAbsenceFormProps {
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

function attendanceTypeCodeOf(type: AttendanceType | null): string {
	if (!type) return '';
	return type.code;
}

function commentLabel(commentOptional: boolean): string {
	if (commentOptional) return 'Toelichting';
	return 'Toelichting *';
}

export default function NewAppointmentAbsenceForm(props: NewAppointmentAbsenceFormProps) {
	const commentRef = useRef<HTMLTextAreaElement>(null);
	const selectedType = getAttendanceType(props.attendanceTypeCode);
	const commentOptional = selectedType ? !selectedType.commentMandatory : true;

	const handleReasonSelect = (type: AttendanceType | null) => {
		props.onAttendanceTypeCodeChange(attendanceTypeCodeOf(type));
		if (!type) return;
		requestAnimationFrame(() => {
			commentRef.current?.focus();
		});
	};

	return (
		<div className="space-y-4">
			<DateAndTimeRangePicker
				dateKey={props.dateKey}
				startTime={props.startTime}
				endTime={props.endTime}
				onDateKeyChange={props.onDateKeyChange}
				onStartTimeChange={props.onStartTimeChange}
				onEndTimeChange={props.onEndTimeChange}
				dateId="absence-date"
				startTimeId="absence-start-time"
				endTimeId="absence-end-time"
				popoverContainer={props.popoverContainer}
				onDatePickerOpenChange={props.onDatePickerOpenChange}
			/>

			<NewAppointmentAbsenceReasonField
				attendanceTypes={props.attendanceTypes}
				selectedType={selectedType}
				onSelect={handleReasonSelect}
				reasonRef={props.reasonRef}
				onOpenChange={props.onReasonComboboxOpenChange}
			/>

			<Field>
				<Label htmlFor="absence-comment">{commentLabel(commentOptional)}</Label>
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
					value={props.comment}
					onChange={(event) => props.onCommentChange(event.target.value)}
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
					value={props.internalComment}
					onChange={(event) => props.onInternalCommentChange(event.target.value)}
					rows={3}
					className="focus-visible:ring-0 focus-visible:ring-offset-0"
				/>
			</Field>
		</div>
	);
}
