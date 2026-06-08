import { Skeleton } from '@/components/ui/skeleton';
import { getAge } from '@/lib/dateUtils';
import type { StudentDetails } from '@/magister/response/student-details.types';

interface StudentProfilePersonalFieldsProps {
	loading: boolean;
	personalDetails?: StudentDetails | null;
}

export default function StudentProfilePersonalFields({ loading, personalDetails }: StudentProfilePersonalFieldsProps) {
	if (loading) {
		return (
			<>
				<span className="text-sm font-medium text-muted-foreground">Geboren</span>
				<Skeleton className="h-4 w-24" />
				<span className="text-sm font-medium text-muted-foreground">Woonsituatie</span>
				<Skeleton className="h-4 w-24" />
			</>
		);
	}

	if (!personalDetails) return null;

	const dob = new Date(personalDetails.geboortedatum);

	return (
		<>
			<span className="text-sm font-medium text-muted-foreground">Leeftijd</span>
			<span className="text-sm text-foreground flex flex-col">
				<span>{getAge(dob)} jaar</span>
				<span className="text-xs text-muted-foreground">
					{dob.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })},{' '}
					{personalDetails.geboorteplaats ?? '-'}
				</span>
			</span>
			<span className="text-sm font-medium text-muted-foreground">Woonsituatie</span>
			<span className="text-sm text-foreground">{personalDetails.woonsituatie?.omschrijving ?? '-'}</span>
		</>
	);
}
