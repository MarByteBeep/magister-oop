import { createContext, useContext } from 'react';
import type { MagisterSessionStatus } from '@/lib/session/magisterSession';

export const MagisterSessionContext = createContext<MagisterSessionStatus>('ready');

export function useMagisterSession() {
	return useContext(MagisterSessionContext);
}
