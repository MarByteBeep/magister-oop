import StudentProfileAddressFields from '@/components/student/profile/StudentProfileAddressFields';
import StudentProfileBasicFields from '@/components/student/profile/StudentProfileBasicFields';
import StudentProfilePersonalFields from '@/components/student/profile/StudentProfilePersonalFields';
import type { Address } from '@/magister/response/address.types';
import type { StudentDetails } from '@/magister/response/studentDetails.types';
import type { Student } from '@/types/student.types';

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
