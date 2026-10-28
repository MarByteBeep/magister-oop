import { MAGISTER_SESSION_EXPIRED_MESSAGE } from '@/magister/sessionErrors';

export function schoolApiHttpErrorMessage(status: number): string {
	if (status === 404) return MAGISTER_SESSION_EXPIRED_MESSAGE;
	return `HTTP error ${status}`;
}
