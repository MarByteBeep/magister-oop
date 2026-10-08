import { describe, expect, test } from 'bun:test';
import { claimDraftAppear, clearDraftAppearClaims, draftAppearKey } from '@/lib/agenda/draftAppear';

describe('draftAppear', () => {
	test('claim is one-shot per key and resets after clear', () => {
		clearDraftAppearClaims();
		const key = draftAppearKey({
			start: new Date('2026-09-17T08:00:00'),
			end: new Date('2026-09-17T08:30:00'),
			title: 'Niet gemeld',
		});
		expect(claimDraftAppear(key)).toBe(true);
		expect(claimDraftAppear(key)).toBe(false);
		clearDraftAppearClaims();
		expect(claimDraftAppear(key)).toBe(true);
	});
});
