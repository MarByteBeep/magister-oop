'use client';

import { useState } from 'react';
import { flushSync } from 'react-dom';
import { LuRotateCw } from 'react-icons/lu';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const MIN_SPINNER_MS = 320;

type SyncButtonBase = {
	/** Accessible name; also the default tooltip. */
	label: string;
	/** Tooltip when different from `label` (e.g. loading / not ready). */
	tooltip?: string;
	/** External busy flag (e.g. bulk-list `refreshing`). Combined with in-flight sync. */
	busy?: boolean;
	disabled?: boolean;
	className?: string;
};

type SyncButtonPlain = SyncButtonBase & {
	kind: 'plain';
	toast: string;
	onSync: () => Promise<void>;
};

type SyncButtonDiff = SyncButtonBase & {
	kind: 'diff';
	toast: { changed: string; unchanged: string };
	onSync: () => Promise<{ changed: boolean }>;
};

export type SyncButtonProps = SyncButtonPlain | SyncButtonDiff;

/**
 * Icon button for user-triggered refresh. Toast copy is required so every
 * manual sync surfaces feedback.
 */
export default function SyncButton(props: SyncButtonProps) {
	const { label, tooltip = label, busy = false, disabled = false, className } = props;
	const [pending, setPending] = useState(false);
	const isBusy = busy || pending;

	async function handleSync() {
		if (disabled || isBusy) return;
		const startedAt = performance.now();
		flushSync(() => {
			setPending(true);
		});
		try {
			if (props.kind === 'plain') {
				await props.onSync();
				toast.message(props.toast);
			} else {
				const { changed } = await props.onSync();
				if (changed) toast.success(props.toast.changed);
				else toast.message(props.toast.unchanged);
			}
		} catch (err) {
			console.error('Sync failed:', err);
		} finally {
			const elapsed = performance.now() - startedAt;
			if (elapsed < MIN_SPINNER_MS) {
				await new Promise((resolve) => setTimeout(resolve, MIN_SPINNER_MS - elapsed));
			}
			setPending(false);
		}
	}

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
					disabled={disabled || isBusy}
					aria-busy={isBusy}
					aria-label={label}
					onClick={() => void handleSync()}
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
