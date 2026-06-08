import { MailAddress } from '@/components/ui/mailaddress';
import { PhoneNumber } from '@/components/ui/phonenumber';
import type { Student } from '@/magister/types';
import GenderIcon from './GenderIcon';

interface StudentProfileBasicFieldsProps {
	student: Student;
	fullName: string;
	gender?: string;
}

export default function StudentProfileBasicFields({ student, fullName, gender }: StudentProfileBasicFieldsProps) {
	return (
		<>
			<span className="text-sm font-medium text-muted-foreground">Naam</span>
			<span className="text-sm truncate text-foreground flex items-center gap-1">
				{fullName}
				<span className="text-muted-foreground truncate">{gender ? <GenderIcon gender={gender} /> : null}</span>
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
		</>
	);
}
