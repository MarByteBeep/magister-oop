/**
 * Shared surfaces and labels. Hues come from `--color-absence` and `--color-return-measure` in index.css.
 *
 * Reschedule planner tones:
 * - source (current / not reported) → solid orange
 * - draft (new plan) → emerald
 * - ghost → other existing measures (muted orange + hatch)
 */

export const absenceSurfaceClasses =
	'bg-absence/45 border-absence/70 hover:bg-absence/55 hover:border-absence/85 dark:bg-absence/35 dark:border-absence/60';

/** Full-strength return-measure fill (selected / newly planned slot). */
export const returnMeasureSurfaceClasses =
	'bg-return-measure/45 border-return-measure/70 hover:bg-return-measure/55 hover:border-return-measure/85 dark:bg-return-measure/40 dark:border-return-measure/65';

/**
 * Diagonal hatch used on breaks and other (non-focus) return measures.
 * Pair with a fill via background-color; this only sets background-image.
 */
export const agendaHatchBackgroundImageClass =
	'[background-image:repeating-linear-gradient(-45deg,transparent,transparent_4px,color-mix(in_oklch,var(--foreground)_5%,transparent)_4px,color-mix(in_oklch,var(--foreground)_5%,transparent)_5px)]';

/** Absolute overlay with the same hatch (for elements that already use background-image). */
export const agendaHatchOverlayClasses = `pointer-events-none absolute inset-0 ${agendaHatchBackgroundImageClass}`;

/** Other return measures while rescheduling — muted orange + hatch. */
export const returnMeasureGhostSurfaceClasses = [
	'bg-return-measure/18 border-return-measure/40 border-dashed',
	'dark:bg-return-measure/14 dark:border-return-measure/35',
	agendaHatchBackgroundImageClass,
].join(' ');

/** Source measure in the reschedule planner (current / not reported) — solid orange. */
export const returnMeasureSourceSurfaceClasses =
	'bg-return-measure/40 border-return-measure/70 hover:bg-return-measure/50 hover:border-return-measure/85 dark:bg-return-measure/35 dark:border-return-measure/60';

export const absenceTextClasses = 'text-absence';

export const returnMeasureTextClasses = 'text-return-measure';

export const returnMeasureIconClasses = 'text-return-measure';

/** Emerald fill for the new plan draft (and legend “Nieuwe planning”). */
export const returnMeasureNewPlanSurfaceClasses =
	'bg-emerald-500/55 border-emerald-500 border-2 border-solid shadow-md shadow-black/15 dark:bg-emerald-500/50 dark:border-emerald-400 dark:shadow-black/30';

/** Reschedule / create draft overlay — emerald new plan. */
export const agendaDraftOverlaySurfaceClasses = returnMeasureNewPlanSurfaceClasses;

export const agendaHoverOverlaySurfaceClasses =
	'border-dashed border-sky-500/55 bg-sky-500/12 dark:border-sky-400/60 dark:bg-sky-400/14';

export const agendaDraftOverlayBadgeClasses =
	'border-emerald-600/55 bg-emerald-500/35 text-emerald-950 dark:border-emerald-400/60 dark:bg-emerald-500/40 dark:text-emerald-100';

export const agendaHoverOverlayBadgeClasses =
	'border-sky-500/40 bg-sky-500/20 text-sky-700 dark:border-sky-400/45 dark:bg-sky-400/25 dark:text-sky-200';
