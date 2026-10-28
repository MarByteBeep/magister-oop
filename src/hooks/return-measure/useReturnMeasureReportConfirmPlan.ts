import { useEffect, useState } from 'react';
import type { CreateReturnMeasureFormInput } from '@/lib/return-measure/createRequest';
import type { ReturnMeasureReportAction } from '@/lib/return-measure/report';

/** Local plan-toggle state for the not-reported confirm dialog. */
export function useReturnMeasureReportConfirmPlan(action: ReturnMeasureReportAction | null) {
	const isNotReported = action === 'not-reported';
	const [planEnabled, setPlanEnabled] = useState(true);
	const [plans, setPlans] = useState<CreateReturnMeasureFormInput[]>([]);

	useEffect(() => {
		if (action != null) return;
		setPlanEnabled(true);
		setPlans([]);
	}, [action]);

	function setPlanEnabledAndClear(enabled: boolean) {
		setPlanEnabled(enabled);
		if (!enabled) setPlans([]);
	}

	return {
		isNotReported,
		planEnabled,
		plans,
		setPlans,
		setPlanEnabledAndClear,
		showPlanner: isNotReported && planEnabled,
		canConfirm: !isNotReported || !planEnabled || plans.length >= 1,
		confirmPlans: isNotReported && planEnabled ? plans : [],
	};
}
