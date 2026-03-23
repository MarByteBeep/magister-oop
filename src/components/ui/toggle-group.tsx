'use client';

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import * as React from 'react';

import { cn } from '@/lib/utils';

const ToggleGroupContext = React.createContext<{ size?: 'default' | 'sm' | 'lg' } | undefined>(undefined);

function useToggleGroupContext() {
	const context = React.useContext(ToggleGroupContext);
	return context;
}

const ToggleGroup = React.forwardRef<
	React.ElementRef<typeof ToggleGroupPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & {
		size?: 'default' | 'sm' | 'lg';
	}
>(({ className, size = 'default', ...props }, ref) => (
	<ToggleGroupContext.Provider value={{ size }}>
		<ToggleGroupPrimitive.Root
			ref={ref}
			data-slot="toggle-group"
			className={cn('inline-flex items-center justify-center gap-1.5', className)}
			{...props}
		/>
	</ToggleGroupContext.Provider>
));

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

const toggleItemSizes = {
	default: 'h-9 px-4',
	sm: 'h-8 px-3 text-sm',
	lg: 'h-10 px-6',
};

const ToggleGroupItem = React.forwardRef<
	React.ElementRef<typeof ToggleGroupPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & {
		size?: 'default' | 'sm' | 'lg';
	}
>(({ className, size: sizeProp, ...props }, ref) => {
	const context = useToggleGroupContext();
	const size = sizeProp ?? context?.size ?? 'default';

	return (
		<ToggleGroupPrimitive.Item
			ref={ref}
			data-slot="toggle-group-item"
			className={cn(
				'group inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-all',
				'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
				'dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
				'disabled:pointer-events-none disabled:opacity-50',
				'data-[state=on]:border-transparent data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-xs',
				toggleItemSizes[size],
				className,
			)}
			{...props}
		/>
	);
});

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem };
