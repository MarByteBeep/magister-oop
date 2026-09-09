import { createContext, useContext } from 'react';
import type { RegistrationsResponse } from '@/magister/response/registrations.types';

export interface RegistrationsState {
	data: RegistrationsResponse | null;
	loading: boolean;
	refreshing: boolean;
	error: string | null;
	registrationCount: number;
	refresh: () => void;
}

export const RegistrationsContext = createContext<RegistrationsState | undefined>(undefined);

export function useRegistrationsContext() {
	const ctx = useContext(RegistrationsContext);
	if (!ctx) {
		throw new Error('useRegistrationsContext must be used inside <RegistrationsProvider>');
	}
	return ctx;
}
