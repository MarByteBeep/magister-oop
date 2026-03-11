import { cn } from '@/lib/utils';

interface MailAddressProps extends React.HTMLAttributes<HTMLDivElement> {
	address: string;
}

export function MailAddress({ className, address }: MailAddressProps) {
	return (
		<span className={cn('text-sm text-blue-500 hover:underline truncate', className)}>
			{address && <a href={`mailto:${address}`}>{address}</a>}
		</span>
	);
}
