'use client';

import { type RefObject, useMemo, useState } from 'react';
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from '@/components/ui/combobox';
import { Field } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { filterAttendanceTypes } from '@/lib/absence-notice/filterAttendanceTypes';
import type { AttendanceType } from '@/magister/response/attendanceType.types';

function attendanceTypeLabel(type: AttendanceType): string {
	return `${type.code} — ${type.description}`;
}

interface NewAppointmentAbsenceReasonFieldProps {
	attendanceTypes: AttendanceType[];
	selectedType: AttendanceType | undefined;
	onSelect: (type: AttendanceType | null) => void;
	reasonRef: RefObject<HTMLInputElement | null>;
	popoverContainer?: HTMLElement | null;
}

export default function NewAppointmentAbsenceReasonField({
	attendanceTypes,
	selectedType,
	onSelect,
	reasonRef,
	popoverContainer,
}: NewAppointmentAbsenceReasonFieldProps) {
	const [reasonQuery, setReasonQuery] = useState('');
	const filteredAttendanceTypes = useMemo(
		() => filterAttendanceTypes(attendanceTypes, reasonQuery),
		[attendanceTypes, reasonQuery],
	);

	return (
		<Field>
			<Label htmlFor="absence-reason">Reden *</Label>
			<Combobox
				items={attendanceTypes}
				filteredItems={filteredAttendanceTypes}
				value={selectedType ?? null}
				onValueChange={onSelect}
				onInputValueChange={setReasonQuery}
				itemToStringLabel={attendanceTypeLabel}
				isItemEqualToValue={(a, b) => a.code === b.code}
				autoHighlight
			>
				<ComboboxInput
					ref={reasonRef}
					id="absence-reason"
					aria-label="Reden"
					placeholder="Selecteer of zoek een reden"
				/>
				<ComboboxContent container={popoverContainer}>
					<ComboboxEmpty>Geen reden gevonden.</ComboboxEmpty>
					<ComboboxList>
						{(type) => (
							<ComboboxItem key={type.code} value={type}>
								{attendanceTypeLabel(type)}
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
		</Field>
	);
}
