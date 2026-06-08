import type { Address } from '@/magister/response/address.types';
import type { StudentDetails } from '@/magister/response/student-details.types';
import type { Student } from '@/magister/types';
import StudentProfileAddressFields from './StudentProfileAddressFields';
import StudentProfileBasicFields from './StudentProfileBasicFields';
import StudentProfilePersonalFields from './StudentProfilePersonalFields';

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
	return (
		<div className="grid grid-cols-[1fr_2fr] gap-2">
			<StudentProfileBasicFields student={student} fullName={fullName} gender={personalDetails?.geslacht} />
			<StudentProfilePersonalFields loading={loadingPersonalDetails} personalDetails={personalDetails} />
			<StudentProfileAddressFields loading={loadingAddress} address={address} />
		</div>
	);
}
