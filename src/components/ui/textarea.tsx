import type * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				'peer flex field-sizing-content min-h-16 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none',
				'placeholder:text-muted-foreground',
				'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
				'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
				'dark:border-input dark:bg-input/30',
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };
