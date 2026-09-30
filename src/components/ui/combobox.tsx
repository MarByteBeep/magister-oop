'use client';

import { Combobox as ComboboxPrimitive } from '@base-ui/react';
import { LuCheck, LuChevronDown } from 'react-icons/lu';

import { cn } from '@/lib/utils';

const Combobox = ComboboxPrimitive.Root;

function ComboboxInput({
	className,
	disabled = false,
	showTrigger = true,
	ref,
	...props
}: ComboboxPrimitive.Input.Props & {
	showTrigger?: boolean;
}) {
	return (
		<div className={cn('relative w-full', className)}>
			<ComboboxPrimitive.Input
				ref={ref}
				disabled={disabled}
				className={cn(
					'flex h-9 w-full min-w-0 rounded-md border bg-background py-1 pl-3 pr-9 text-sm shadow-xs outline-none',
					'placeholder:text-muted-foreground',
					'focus-visible:ring-0 focus-visible:ring-offset-0',
					'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
					'dark:border-input dark:bg-input/30',
				)}
				{...props}
			/>
			{showTrigger && (
				<ComboboxPrimitive.Trigger
					disabled={disabled}
					data-slot="combobox-trigger"
					className="absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
				>
					<LuChevronDown className="size-4 opacity-50" />
				</ComboboxPrimitive.Trigger>
			)}
		</div>
	);
}

function ComboboxContent({
	className,
	side = 'bottom',
	sideOffset = 6,
	align = 'start',
	alignOffset = 0,
	container,
	...props
}: ComboboxPrimitive.Popup.Props &
	Pick<ComboboxPrimitive.Positioner.Props, 'side' | 'align' | 'sideOffset' | 'alignOffset'> & {
		container?: HTMLElement | null;
	}) {
	return (
		<ComboboxPrimitive.Portal container={container ?? undefined}>
			{/* pointer-events-auto: Radix modal sets body to pointer-events-none; body portals must opt back in. */}
			<ComboboxPrimitive.Positioner
				side={side}
				sideOffset={sideOffset}
				align={align}
				alignOffset={alignOffset}
				className="pointer-events-auto isolate z-[100]"
			>
				<ComboboxPrimitive.Popup
					data-slot="combobox-content"
					className={cn(
						'group/combobox-content relative max-h-96 w-(--anchor-width) max-w-(--available-width) min-w-(--anchor-width) origin-(--transform-origin) overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
						'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
						className,
					)}
					{...props}
				/>
			</ComboboxPrimitive.Positioner>
		</ComboboxPrimitive.Portal>
	);
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
	return (
		<ComboboxPrimitive.List
			data-slot="combobox-list"
			className={cn(
				'max-h-[min(calc(24rem-2.25rem),calc(var(--available-height)-2.25rem))] scroll-py-1 overflow-y-auto p-1 data-empty:p-0',
				className,
			)}
			{...props}
		/>
	);
}

function ComboboxItem({ className, children, ...props }: ComboboxPrimitive.Item.Props) {
	return (
		<ComboboxPrimitive.Item
			data-slot="combobox-item"
			className={cn(
				'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none',
				'hover:bg-accent hover:text-accent-foreground',
				'data-highlighted:bg-accent data-highlighted:text-accent-foreground',
				'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
				className,
			)}
			{...props}
		>
			{children}
			<ComboboxPrimitive.ItemIndicator
				data-slot="combobox-item-indicator"
				render={
					<span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
				}
			>
				<LuCheck className="pointer-events-none size-4" />
			</ComboboxPrimitive.ItemIndicator>
		</ComboboxPrimitive.Item>
	);
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
	return (
		<ComboboxPrimitive.Empty
			data-slot="combobox-empty"
			className={cn(
				'hidden w-full justify-center py-2 text-center text-sm text-muted-foreground group-data-empty/combobox-content:flex',
				className,
			)}
			{...props}
		/>
	);
}

export { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList };
