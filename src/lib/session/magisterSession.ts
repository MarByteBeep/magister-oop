import { sendRuntimeMessage } from '@/lib/extension/runtimeMessage';

export const MAGISTER_SESSION_KEY = 'magisterSession';
export const VERIFY_MAGISTER_SESSION_MESSAGE = 'verifyMagisterSession';

/** `checking`: a newly opened popup whose earlier `ready` has not been re-verified yet. */
export type MagisterSessionStatus = 'checking' | 'connecting' | 'ready' | 'cancelled';

export function isMagisterSessionStatus(value: unknown): value is MagisterSessionStatus {
	return value === 'checking' || value === 'connecting' || value === 'ready' || value === 'cancelled';
}

/** Ask the background to re-check a `ready` session; it starts the login flow when the session is gone. */
export function requestMagisterSessionVerification(): void {
	sendRuntimeMessage({ type: VERIFY_MAGISTER_SESSION_MESSAGE });
}
