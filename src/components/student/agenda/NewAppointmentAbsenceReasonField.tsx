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

interface NewAppointmentAbsenceReasonFieldProps {
	attendanceTypes: AttendanceType[];
	selectedType: AttendanceType | undefined;
	onSelect: (type: AttendanceType | null) => void;
	reasonRef: RefObject<HTMLInputElement | null>;
	popoverContainer?: HTMLElement | null;
	onOpenChange?: (open: boolean) => void;
}

export default function NewAppointmentAbsenceReasonField({
	attendanceTypes,
	selectedType,
	onSelect,
	reasonRef,
	popoverContainer,
	onOpenChange,
}: NewAppointmentAbsenceReasonFieldProps) {
	const selectedTypeRef = useRef(selectedType);
	selectedTypeRef.current = selectedType;

	const [inputValue, setInputValue] = useState(() => (selectedType ? attendanceTypeLabel(selectedType) : ''));
	const filteredAttendanceTypes = useMemo(
		() => filterAttendanceTypes(attendanceTypes, inputValue),
		[attendanceTypes, inputValue],
	);

	useEffect(() => {
		setInputValue(selectedType ? attendanceTypeLabel(selectedType) : '');
	}, [selectedType]);

	const clearForSearch = () => {
		if (selectedTypeRef.current) setInputValue('');
	};

	return (
		<Field>
			<Label htmlFor="absence-reason">Reden *</Label>
			<Combobox
				items={attendanceTypes}
				filteredItems={filteredAttendanceTypes}
				value={selectedType ?? null}
				inputValue={inputValue}
				onValueChange={(type) => {
					selectedTypeRef.current = type ?? undefined;
					onSelect(type);
				}}
				onInputValueChange={setInputValue}
				onOpenChange={(open) => {
					onOpenChange?.(open);
					if (open) {
						clearForSearch();
						return;
					}
					const current = selectedTypeRef.current;
					setInputValue(current ? attendanceTypeLabel(current) : '');
				}}
				itemToStringLabel={attendanceTypeLabel}
				isItemEqualToValue={(a, b) => a.code === b.code}
				autoHighlight
			>
				<ComboboxInput
					ref={reasonRef}
					id="absence-reason"
					aria-label="Reden"
					placeholder="Selecteer of zoek een reden"
					onFocus={clearForSearch}
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
