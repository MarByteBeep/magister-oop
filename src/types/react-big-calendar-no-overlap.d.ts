declare module 'react-big-calendar/lib/utils/layout-algorithms/no-overlap.js' {
	type LayoutArgs = {
		events: unknown[];
		minimumStartDifference: number;
		slotMetrics: unknown;
		accessors: unknown;
	};

	type StyledEvent = {
		event: unknown;
		style: {
			top: number;
			height: number;
			width: number | string;
			xOffset: number | string;
			left?: number;
		};
	};

	const noOverlap: (args: LayoutArgs) => StyledEvent[];
	export default noOverlap;
}
