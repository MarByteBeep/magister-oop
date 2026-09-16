import type * as React from 'react';

import { cn } from '@/lib/utils';

function Field({ className, ...props }: React.ComponentProps<'div'>) {
	return <div data-slot="field" className={cn('grid gap-2', className)} {...props} />;
}

export { Field };
