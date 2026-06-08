import { MailAddress } from '@/components/ui/mailaddress';
import { PhoneNumber } from '@/components/ui/phonenumber';
import { Skeleton } from '@/components/ui/skeleton';
import { getAge } from '@/lib/dateUtils';
import type { Address } from '@/magister/response/address.types';
import type { StudentDetails } from '@/magister/response/student-details.types';
import type { Student } from '@/magister/types';
import GenderIcon from './GenderIcon';

interface StudentProfileDetailsProps {
	student: Student;
	fullName: string;
	personalDetails?: StudentDetails | null;
	address?: Address | null;
	loadingPersonalDetails: boolean;
	loadingAddress: boolean;
}

export default function StudentProfileDetails({
	student,
	fullName,
	personalDetails,
	address,
	loadingPersonalDetails,
	loadingAddress,
}: StudentProfileDetailsProps) {
	const googleMapsUrl = address
		? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
				`${address.straat} ${address.huisnummer}${address.toevoeging ?? ''} ${address.plaats}`,
			)}`
		: '';
	const dob = personalDetails ? new Date(personalDetails.geboortedatum) : undefined;

	return (
		<div className="grid grid-cols-[1fr_2fr] gap-2">
			<span className="text-sm font-medium text-muted-foreground">Naam</span>
			<span className="text-sm truncate text-foreground flex items-center gap-1">
				{fullName}
				<span className="text-muted-foreground truncate">
					{personalDetails ? <GenderIcon gender={personalDetails.geslacht} /> : null}
				</span>
			</span>

			<span className="text-sm font-medium text-muted-foreground">Klas</span>
			<span className="text-sm text-foreground">{student.klassen.join(', ')}</span>

			<span className="text-sm font-medium text-muted-foreground">E-mail</span>
			<MailAddress address={student.emailadres} />

			{student.telefoonnummer ? (
				<>
					<span className="text-sm font-medium text-muted-foreground">Telefoon</span>
					<PhoneNumber phoneNumber={student.telefoonnummer} />
				</>
			) : null}

			<span className="text-sm font-medium text-muted-foreground">Kluisje</span>
			<span className="text-sm text-foreground">{student.lockerCode || '-'}</span>

			{loadingPersonalDetails ? (
				<>
					<span className="text-sm font-medium text-muted-foreground">Geboren</span>
					<Skeleton className="h-4 w-24" />
					<span className="text-sm font-medium text-muted-foreground">Woonsituatie</span>
					<Skeleton className="h-4 w-24" />
				</>
			) : (
				personalDetails && (
					<>
						<span className="text-sm font-medium text-muted-foreground">Leeftijd</span>
						<span className="text-sm text-foreground flex flex-col">
							<span>{dob ? `${getAge(dob)} jaar` : '-'}</span>
							<span className="text-xs text-muted-foreground">
								{dob?.toLocaleDateString('nl-NL', {
									day: 'numeric',
									month: 'long',
									year: 'numeric',
								})}
								, {personalDetails.geboorteplaats ?? '-'}
							</span>
						</span>
						<span className="text-sm font-medium text-muted-foreground">Woonsituatie</span>
						<span className="text-sm text-foreground">
							{personalDetails.woonsituatie?.omschrijving ?? '-'}
						</span>
					</>
				)
			)}

			{loadingAddress ? (
				<>
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-16" />
				</>
			) : (
				address && (
					<>
						<span className="text-sm font-medium text-muted-foreground">Adres</span>
						<span className="text-sm text-foreground">
							<a
								href={googleMapsUrl}
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
				)
			)}
		</div>
	);
}
