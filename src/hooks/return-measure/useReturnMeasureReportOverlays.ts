import { useEffect, useState } from 'react';
import { snapshotReturnMeasureReportOverlays, subscribeReturnMeasureReportOverlays } from '@/lib/return-measure/report';

export function useReturnMeasureReportOverlays() {
	const [overlays, setOverlays] = useState(snapshotReturnMeasureReportOverlays);

	useEffect(() => subscribeReturnMeasureReportOverlays(() => setOverlays(snapshotReturnMeasureReportOverlays())), []);

	return overlays;
}
