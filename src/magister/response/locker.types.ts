import type { Links } from '@/magister/types';

export type Locker = {
	id: string; // uuid: same as lockerid
	lockerId: string; // uuid: same as lockerid
	unitId: string; // uuid
	lockerTypeTitle: string;
	cluster: {
		id: string; // uuid
		title: string;
	};
	clusterTitle: string;
	lockerCode: string; // e.g., "124", "013"
	keyCode: string; // same as lockerCode
	lockCode: string;
	rentalPeriod?: {
		id: string; // uuid
		startDate: string; // yyyy-mm-dd, e.g., "2025-09-12"
		endDate: string; // yyyy-mm-dd, e.g., "2026-09-17"
		rent: number;
		deposit: number;
		keyState: string; // always "handedOut"
		student: {
			id: string; // uuid : matches with Leerling.externeId
			firstName: string;
			familyName: string;
			studentNumber: number; // matches with Leerling.code
			personId: number; // matches with Leerling.id
			group: string;
			study: string;
			hasPhoto: boolean;
			hasActiveStudy: boolean;
		};
		links: Record<string, unknown>; // empty
	};
	links: Links;
};

export type LockersResponse = {
	lockersDetails: Locker[];
	links: Links;
};
