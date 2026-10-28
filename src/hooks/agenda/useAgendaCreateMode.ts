import type { AgendaSelectionMode } from '@/hooks/agenda/agendaSelectionMode';
import type { AgendaSelectSlotHandler } from '@/hooks/agenda/useAgendaCalendarSelection';
import { useCreateAppointmentMode } from '@/hooks/agenda/useCreateAppointmentMode';

export function useAgendaCreateMode(
	selectionMode: AgendaSelectionMode,
	onSelectSlot: AgendaSelectSlotHandler | undefined,
) {
	const slotSelectionEnabled = onSelectSlot !== undefined;
	const ctrlCreateMode = useCreateAppointmentMode(slotSelectionEnabled && selectionMode === 'ctrl');
	const createMode = selectionMode === 'always' ? slotSelectionEnabled : ctrlCreateMode;
	return { slotSelectionEnabled, createMode };
}
