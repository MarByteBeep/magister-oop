import { Skeleton } from '@/components/ui/skeleton';
import { getAge } from '@/lib/shared/dateUtils';
import type { StudentDetails } from '@/magister/response/studentDetails.types';

export interface StudentProfilePersonalFieldsProps {
	loading: boolean;
	personalDetails?: StudentDetails | null;
}

function PersonalFieldsSkeleton() {
	return (
		<>
			<span className="text-sm font-medium text-muted-foreground">Geboren</span>
			<Skeleton className="h-4 w-24" />
			<span className="text-sm font-medium text-muted-foreground">Woonsituatie</span>
			<Skeleton className="h-4 w-24" />
		</>
	);
}

function birthPlaceLabel(personalDetails: StudentDetails): string {
	if (personalDetails.geboorteplaats) return personalDetails.geboorteplaats;
	return '-';
}

function livingSituationLabel(personalDetails: StudentDetails): string {
	const situation = personalDetails.woonsituatie;
	if (!situation) return '-';
	if (!situation.omschrijving) return '-';
	return situation.omschrijving;
}

function PersonalFieldsValues({ personalDetails }: { personalDetails: StudentDetails }) {
	const dob = new Date(personalDetails.geboortedatum);
	return (
		<>
			<span className="text-sm font-medium text-muted-foreground">Leeftijd</span>
			<span className="text-sm text-foreground flex flex-col">
				<span>{getAge(dob)} jaar</span>
				<span className="text-xs text-muted-foreground">
					{dob.toLocaleDateString('nl-NL', {
						day: 'numeric',
						month: 'long',
						year: 'numeric',
					})}
					, {birthPlaceLabel(personalDetails)}
				</span>
			</span>
			<span className="text-sm font-medium text-muted-foreground">Woonsituatie</span>
			<span className="text-sm text-foreground">{livingSituationLabel(personalDetails)}</span>
		</>
	);
}

function PersonalFieldsBody({ personalDetails }: { personalDetails?: StudentDetails | null }) {
	if (!personalDetails) return null;
	return <PersonalFieldsValues personalDetails={personalDetails} />;
}

export default function StudentProfilePersonalFields({ loading, personalDetails }: StudentProfilePersonalFieldsProps) {
	if (loading) return <PersonalFieldsSkeleton />;
	return <PersonalFieldsBody personalDetails={personalDetails} />;
}
