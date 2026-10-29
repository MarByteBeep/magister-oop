'use client';

import { useState } from 'react';
import { flushSync } from 'react-dom';
import { LuRotateCw } from 'react-icons/lu';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const MIN_SPINNER_MS = 320;
const DEFAULT_ERROR_TOAST = 'Synchroniseren mislukt';

export type SyncButtonBase = {
	/** Accessible name; also the default tooltip. */
	label: string;
	/** Tooltip when different from `label` (e.g. loading / not ready). */
	tooltip?: string;
	/** External busy flag (e.g. bulk-list `refreshing`). Combined with in-flight sync. */
	busy?: boolean;
	disabled?: boolean;
	className?: string;
};

export type SyncButtonPlain = SyncButtonBase & {
	kind: 'plain';
	toast: string;
	errorToast?: string;
	onSync: () => Promise<boolean>;
};

export type SyncButtonDiff = SyncButtonBase & {
	kind: 'diff';
	toast: { changed: string; unchanged: string };
	onSync: () => Promise<{ changed: boolean }>;
};

export type SyncButtonProps = SyncButtonPlain | SyncButtonDiff;

function plainErrorToast(props: SyncButtonPlain): string {
	return props.errorToast ?? DEFAULT_ERROR_TOAST;
}

function unknownErrorMessage(err: unknown): string {
	if (err instanceof Error) return err.message;
	return 'Onbekende fout';
}

async function runPlainSync(props: SyncButtonPlain): Promise<void> {
	const ok = await props.onSync();
	if (ok) toast.message(props.toast);
	else toast.error(plainErrorToast(props));
}

async function runDiffSync(props: SyncButtonDiff): Promise<void> {
	const { changed } = await props.onSync();
	if (changed) toast.success(props.toast.changed);
	else toast.message(props.toast.unchanged);
}

async function runSync(props: SyncButtonProps): Promise<void> {
	if (props.kind === 'plain') return runPlainSync(props);
	return runDiffSync(props);
}

function failureToastTitle(props: SyncButtonProps): string {
	if (props.kind === 'plain') return plainErrorToast(props);
	return DEFAULT_ERROR_TOAST;
}

function reportSyncFailure(props: SyncButtonProps, err: unknown): void {
	console.error('Sync failed:', err);
	toast.error(failureToastTitle(props), {
		description: unknownErrorMessage(err),
	});
}

async function waitOutMinSpinner(startedAt: number): Promise<void> {
	const elapsed = performance.now() - startedAt;
	if (elapsed >= MIN_SPINNER_MS) return;
	await new Promise((resolve) => setTimeout(resolve, MIN_SPINNER_MS - elapsed));
}

function shouldBlockSync(disabled: boolean, isBusy: boolean): boolean {
	return disabled || isBusy;
}

async function performSyncClick(props: SyncButtonProps, setPending: (value: boolean) => void): Promise<void> {
	const startedAt = performance.now();
	flushSync(() => {
		setPending(true);
	});
	try {
		await runSync(props);
	} catch (err) {
		reportSyncFailure(props, err);
	} finally {
		await waitOutMinSpinner(startedAt);
		setPending(false);
	}
}

type SyncButtonViewProps = {
	label: string;
	tooltip: string;
	isBusy: boolean;
	disabled: boolean;
	className?: string;
	onClick: () => void;
};

function SyncButtonView({ label, tooltip, isBusy, disabled, className, onClick }: SyncButtonViewProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className={cn(
						'h-8 w-8 shrink-0 text-muted-foreground hover:text-primary disabled:opacity-100',
						className,
					)}
					disabled={disabled}
					aria-busy={isBusy}
					aria-label={label}
					onClick={onClick}
				>
					<span className={cn('inline-flex transition-none', isBusy && 'animate-spin')}>
						<LuRotateCw className="h-4 w-4" />
					</span>
				</Button>
			</TooltipTrigger>
			<TooltipContent>{tooltip}</TooltipContent>
		</Tooltip>
	);
}

/**
 * Icon button for user-triggered refresh. Toast copy is required so every
 * manual sync surfaces feedback.
 */
export default function SyncButton(props: SyncButtonProps) {
	const label = props.label;
	const tooltip = props.tooltip ?? label;
	const busy = props.busy === true;
	const disabled = props.disabled === true;
	const [pending, setPending] = useState(false);
	const isBusy = busy || pending;

	function handleSync() {
		if (shouldBlockSync(disabled, isBusy)) return;
		void performSyncClick(props, setPending);
	}

	return (
		<SyncButtonView
			label={label}
			tooltip={tooltip}
			isBusy={isBusy}
			disabled={shouldBlockSync(disabled, isBusy)}
			className={props.className}
			onClick={handleSync}
		/>
	);
}
