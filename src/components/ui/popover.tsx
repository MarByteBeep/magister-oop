'use client';

import * as PopoverPrimitive from '@radix-ui/react-popover';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = ({
	className,
	align = 'center',
	sideOffset = 4,
	container,
	...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
	container?: HTMLElement | null;
}) => (
	<PopoverPrimitive.Portal container={container ?? undefined}>
		<PopoverPrimitive.Content
			align={align}
			sideOffset={sideOffset}
			data-slot="popover-content"
			className={cn(
				'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none',
				className,
			)}
			{...props}
		/>
	</PopoverPrimitive.Portal>
);

export { Popover, PopoverContent, PopoverTrigger };
