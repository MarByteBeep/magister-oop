import { Skeleton } from '@/components/ui/skeleton';
import { trimmedOrUndefined } from '@/lib/shared/stringUtils';
import type { Address } from '@/magister/response/address.types';

export interface StudentProfileAddressFieldsProps {
	loading: boolean;
	address?: Address | null;
}

function houseNumberSuffix(toevoeging: string | null | undefined): string {
	return trimmedOrUndefined(toevoeging) ?? '';
}

function buildGoogleMapsUrl(address: Address): string {
	const query = `${address.straat} ${address.huisnummer}${houseNumberSuffix(address.toevoeging)} ${address.plaats}`;
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function AddressFields({ address }: { address: Address }) {
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
						{houseNumberSuffix(address.toevoeging)}
					</div>
					<div>
						{address.postcode} {address.plaats}
					</div>
				</a>
			</span>
		</>
	);
}

export default function StudentProfileAddressFields(props: StudentProfileAddressFieldsProps) {
	if (props.loading) {
		return (
			<>
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-4 w-16" />
			</>
		);
	}
	if (!props.address) return null;
	return <AddressFields address={props.address} />;
}
