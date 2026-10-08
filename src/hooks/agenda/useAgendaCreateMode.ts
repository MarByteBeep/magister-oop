import type { AgendaSelectionMode } from '@/hooks/agenda/agendaSelectionMode';
import { useCreateAppointmentMode } from '@/hooks/agenda/useCreateAppointmentMode';
import type { AgendaSlotSelection } from '@/lib/agenda/slotSelection';

export function useAgendaCreateMode(
	selectionMode: AgendaSelectionMode,
	onSelectSlot: ((selection: AgendaSlotSelection) => void) | undefined,
) {
	const slotSelectionEnabled = onSelectSlot !== undefined;
	const ctrlCreateMode = useCreateAppointmentMode(slotSelectionEnabled && selectionMode === 'ctrl');
	const createMode = selectionMode === 'always' ? slotSelectionEnabled : ctrlCreateMode;
	return { slotSelectionEnabled, createMode };
}
