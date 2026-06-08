'use client';

import Avatar from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Address } from '@/magister/response/address.types';
import type { StudentDetails } from '@/magister/response/student-details.types';
import type { Student } from '@/magister/types';
import StudentProfileDetails from './StudentProfileDetails';

interface StudentProfileCardProps {
	student: Student;
	fullName: string;
	initials: string;
	photoHref?: string;
	photoBlobUrl?: string;
	personalDetails?: StudentDetails | null;
	address?: Address | null;
	loadingPersonalDetails: boolean;
	loadingAddress: boolean;
}

export default function StudentProfileCard({
	student,
	fullName,
	initials,
	photoHref,
	photoBlobUrl,
	personalDetails,
	address,
	loadingPersonalDetails,
	loadingAddress,
}: StudentProfileCardProps) {
	return (
		<Card className="row-span-2 col-start-1 row-start-1">
			<CardHeader>
				<div className="flex flex-col items-center justify-center pb-6">
					{photoHref && !photoBlobUrl ? (
						<Skeleton className="h-24 w-24 rounded-full" />
					) : (
						<Avatar src={photoBlobUrl} alt={fullName} initials={initials} className="h-48 w-48 text-6xl " />
					)}
				</div>
			</CardHeader>
			<CardContent>
				<StudentProfileDetails
					student={student}
					fullName={fullName}
					personalDetails={personalDetails}
					address={address}
					loadingPersonalDetails={loadingPersonalDetails}
					loadingAddress={loadingAddress}
				/>
			</CardContent>
		</Card>
	);
}
