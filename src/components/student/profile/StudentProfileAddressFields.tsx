import { Skeleton } from '@/components/ui/skeleton';
import type { Address } from '@/magister/response/address.types';

interface StudentProfileAddressFieldsProps {
	loading: boolean;
	address?: Address | null;
}

function buildGoogleMapsUrl(address: Address): string {
	const query = `${address.straat} ${address.huisnummer}${address.toevoeging ?? ''} ${address.plaats}`;
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function StudentProfileAddressFields({ loading, address }: StudentProfileAddressFieldsProps) {
	if (loading) {
		return (
			<>
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-4 w-16" />
			</>
		);
	}

	if (!address) return null;

	return (
		<>
			<span className="text-sm font-medium text-muted-foreground">Adres</span>
			<span className="text-sm text-foreground">
				<a
					href={buildGoogleMapsUrl(address)}
					target="_blank"
					rel="noopener noreferrer"
					className="text-foreground underline"
				>
					<div>
						{address.straat} {address.huisnummer}
						{address.toevoeging ?? ''}
					</div>
					<div>
						{address.postcode} {address.plaats}
					</div>
				</a>
			</span>
		</>
	);
}
