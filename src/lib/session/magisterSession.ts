export const MAGISTER_SESSION_KEY = 'magisterSession';

export type MagisterSessionStatus = 'connecting' | 'ready' | 'cancelled';

export function isMagisterSessionStatus(value: unknown): value is MagisterSessionStatus {
	return value === 'connecting' || value === 'ready' || value === 'cancelled';
}
