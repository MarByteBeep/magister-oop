import GenderIcon from '@/components/student/GenderIcon';
import { MailAddress } from '@/components/ui/mail-address';
import { PhoneNumber } from '@/components/ui/phone-number';
import type { Student } from '@/types/student.types';

export interface StudentProfileBasicFieldsProps {
	student: Student;
	fullName: string;
	gender?: string;
}

function GenderMark({ gender }: { gender?: string }) {
	if (!gender) return null;
	return <GenderIcon gender={gender} />;
}

function PhoneFields({ phoneNumber }: { phoneNumber: string | undefined }) {
	if (!phoneNumber) return null;
	return (
		<>
			<span className="text-sm font-medium text-muted-foreground">Telefoon</span>
			<PhoneNumber phoneNumber={phoneNumber} />
		</>
	);
}

function lockerLabel(lockerCode: string | undefined): string {
	if (!lockerCode) return '-';
	return lockerCode;
}

export default function StudentProfileBasicFields(props: StudentProfileBasicFieldsProps) {
	return (
		<>
			<span className="text-sm font-medium text-muted-foreground">Naam</span>
			<span className="text-sm truncate text-foreground flex items-center gap-1">
				{props.fullName}
				<span className="text-muted-foreground truncate">
					<GenderMark gender={props.gender} />
				</span>
			</span>

			<span className="text-sm font-medium text-muted-foreground">Klas</span>
			<span className="text-sm text-foreground">{props.student.klassen.join(', ')}</span>

			<span className="text-sm font-medium text-muted-foreground">E-mail</span>
			<MailAddress address={props.student.emailadres} />

			<PhoneFields phoneNumber={props.student.telefoonnummer} />

			<span className="text-sm font-medium text-muted-foreground">Kluisje</span>
			<span className="text-sm text-foreground">{lockerLabel(props.student.lockerCode)}</span>
		</>
	);
}
