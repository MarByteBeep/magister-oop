import { describe, expect, test } from 'bun:test';
import { agendaSlotSelectionsEqual, buildAgendaOverlayEvents } from '@/lib/agenda/agendaOverlayEvents';
import { toISOFromDateKeyAndTime } from '@/lib/shared/dateUtils';

function selection(dateKey: string, startTime: string, endTime: string) {
	return {
		start: new Date(toISOFromDateKeyAndTime(dateKey, startTime)),
		end: new Date(toISOFromDateKeyAndTime(dateKey, endTime)),
	};
}

describe('agendaSlotSelectionsEqual', () => {
	test('matches identical ranges', () => {
		const left = selection('2026-10-08', '08:00', '16:00');
		const right = selection('2026-10-08', '08:00', '16:00');
		expect(agendaSlotSelectionsEqual(left, right)).toBe(true);
	});

	test('rejects different days', () => {
		expect(
			agendaSlotSelectionsEqual(
				selection('2026-10-08', '08:00', '16:00'),
				selection('2026-10-09', '08:00', '16:00'),
			),
		).toBe(false);
	});
});

describe('buildAgendaOverlayEvents', () => {
	const onSelectSlot = () => {};

	test('keeps the draft selected while hovering another day', () => {
		const draft = selection('2026-10-08', '08:00', '16:00');
		const hover = selection('2026-10-09', '08:00', '16:00');
		const overlays = buildAgendaOverlayEvents(null, draft, hover, onSelectSlot);
		expect(overlays).toHaveLength(2);
		expect(overlays[0]?.isDraft).toBe(true);
		expect(overlays[1]?.isHoverSlot).toBe(true);
		expect(overlays[0]?.start.getTime()).toBe(draft.start.getTime());
		expect(overlays[1]?.start.getTime()).toBe(hover.start.getTime());
	});

	test('does not stack an identical hover on top of the draft', () => {
		const draft = selection('2026-10-08', '08:00', '16:00');
		const overlays = buildAgendaOverlayEvents(null, draft, draft, onSelectSlot);
		expect(overlays).toHaveLength(1);
		expect(overlays[0]?.isDraft).toBe(true);
	});

	test('shows only hover when nothing is selected yet', () => {
		const hover = selection('2026-10-08', '08:00', '16:00');
		const overlays = buildAgendaOverlayEvents(null, null, hover, onSelectSlot);
		expect(overlays).toHaveLength(1);
		expect(overlays[0]?.isHoverSlot).toBe(true);
	});

	test('drag preview replaces other overlays', () => {
		const draft = selection('2026-10-08', '08:00', '16:00');
		const hover = selection('2026-10-09', '08:00', '16:00');
		const preview = selection('2026-10-10', '08:00', '16:00');
		const overlays = buildAgendaOverlayEvents(preview, draft, hover, onSelectSlot);
		expect(overlays).toHaveLength(1);
		expect(overlays[0]?.isDraft).toBe(true);
		expect(overlays[0]?.start.getTime()).toBe(preview.start.getTime());
	});

	test('uses draftLabel as the draft title when provided', () => {
		const draft = selection('2026-10-08', '08:00', '16:00');
		const overlays = buildAgendaOverlayEvents(null, draft, null, onSelectSlot, 'Niet gemeld op 24/06/2026');
		expect(overlays).toHaveLength(1);
		expect(overlays[0]?.title).toBe('Niet gemeld op 24/06/2026');
	});
});
