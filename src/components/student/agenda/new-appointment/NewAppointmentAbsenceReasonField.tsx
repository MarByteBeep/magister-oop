'use client';

import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';
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

function labelForSelectedType(selectedType: AttendanceType | undefined): string {
	if (!selectedType) return '';
	return attendanceTypeLabel(selectedType);
}

export interface NewAppointmentAbsenceReasonFieldProps {
	attendanceTypes: AttendanceType[];
	selectedType: AttendanceType | undefined;
	onSelect: (type: AttendanceType | null) => void;
	reasonRef: RefObject<HTMLInputElement | null>;
	onOpenChange?: (open: boolean) => void;
}

function handleReasonOpenChange(
	open: boolean,
	onOpenChange: ((open: boolean) => void) | undefined,
	selectedTypeRef: React.MutableRefObject<AttendanceType | undefined>,
	setInputValue: (value: string) => void,
	clearForSearch: () => void,
) {
	if (onOpenChange) onOpenChange(open);
	if (open) {
		clearForSearch();
		return;
	}
	setInputValue(labelForSelectedType(selectedTypeRef.current));
}

export default function NewAppointmentAbsenceReasonField(props: NewAppointmentAbsenceReasonFieldProps) {
	const selectedTypeRef = useRef(props.selectedType);
	selectedTypeRef.current = props.selectedType;

	const [inputValue, setInputValue] = useState(() => labelForSelectedType(props.selectedType));
	const filteredAttendanceTypes = useMemo(
		() => filterAttendanceTypes(props.attendanceTypes, inputValue),
		[props.attendanceTypes, inputValue],
	);

	useEffect(() => {
		setInputValue(labelForSelectedType(props.selectedType));
	}, [props.selectedType]);

	const clearForSearch = () => {
		if (selectedTypeRef.current) setInputValue('');
	};

	return (
		<Field>
			<Label htmlFor="absence-reason">Reden *</Label>
			<Combobox
				items={props.attendanceTypes}
				filteredItems={filteredAttendanceTypes}
				value={props.selectedType ?? null}
				inputValue={inputValue}
				onValueChange={(type) => {
					selectedTypeRef.current = type ?? undefined;
					props.onSelect(type);
				}}
				onInputValueChange={setInputValue}
				onOpenChange={(open) =>
					handleReasonOpenChange(open, props.onOpenChange, selectedTypeRef, setInputValue, clearForSearch)
				}
				itemToStringLabel={attendanceTypeLabel}
				isItemEqualToValue={(a, b) => a.code === b.code}
				autoHighlight
			>
				<ComboboxInput
					ref={props.reasonRef}
					id="absence-reason"
					aria-label="Reden"
					placeholder="Selecteer of zoek een reden"
					onFocus={clearForSearch}
				/>
				<ComboboxContent>
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
