'use client';

import { useState } from 'react';
import { LuClock, LuHeartPulse, LuUserX } from 'react-icons/lu';
import StudentParentsCard from '@/components/student/profile/StudentParentsCard';
import StudentProfileCard from '@/components/student/profile/StudentProfileCard';
import StudentAgendaCard from '@/components/student/StudentAgendaCard';
import TardyModal from '@/components/student/tardy/TardyModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudentDetailsData } from '@/hooks/students/useStudentDetailsData';
import { formatPersonName } from '@/lib/shared/stringUtils';
import type { Student } from '@/types/student.types';

export interface DetailsProps {
	student?: Student;
	onOpenStudent?: (student: Student) => void;
}

function DetailsError({ error }: { error: string | null }) {
	if (!error) return null;
	return <p className="text-red-500 text-center my-4">{error}</p>;
}

function QuickActionsCard({ onTardy }: { onTardy: () => void }) {
	return (
		<Card className="col-start-2">
			<CardHeader>
				<CardTitle>Snelle acties</CardTitle>
			</CardHeader>
			<CardContent className="grid grid-cols-3 items-center gap-2 mt-1">
				<Button variant="outline" size="sm" disabled onClick={() => console.log('Ziek clicked')}>
					<LuHeartPulse className="h-4 w-4" /> Ziek
				</Button>
				<Button variant="outline" size="sm" onClick={onTardy}>
					<LuClock className="h-4 w-4" /> Te Laat
				</Button>
				<Button variant="outline" size="sm" disabled onClick={() => console.log('Afwezig clicked')}>
					<LuUserX className="h-4 w-4" /> Afwezig
				</Button>
			</CardContent>
		</Card>
	);
}

function DetailsGrid({
	student,
	onOpenStudent,
	onTardy,
	details,
}: {
	student: Student;
	onOpenStudent?: (student: Student) => void;
	onTardy: () => void;
	details: ReturnType<typeof useStudentDetailsData>;
}) {
	const fullName = formatPersonName(student.roepnaam, student.tussenvoegsel, student.achternaam);
	const initials = `${student.roepnaam.charAt(0)}${student.achternaam.charAt(0)}`.toUpperCase();

	return (
		<div className="grid gap-4 md:grid-cols-3 grid-rows-[120px_auto]">
			<StudentProfileCard
				student={student}
				fullName={fullName}
				initials={initials}
				photoHref={student.links.foto?.href}
				photoBlobUrl={details.photoBlobUrl}
				personalDetails={details.personalDetails}
				address={details.address}
				loadingPersonalDetails={details.loadingPersonalDetails}
				loadingAddress={details.loadingAddress}
			/>

			<QuickActionsCard onTardy={onTardy} />

			<StudentParentsCard
				parentContacts={details.parentContacts}
				loadingParentContacts={details.loadingParentContacts}
			/>

			<StudentAgendaCard student={student} onOpenStudent={onOpenStudent} />
		</div>
	);
}

function DetailsBody({
	student,
	onOpenStudent,
	onTardy,
	details,
}: {
	student: Student | undefined;
	onOpenStudent?: (student: Student) => void;
	onTardy: () => void;
	details: ReturnType<typeof useStudentDetailsData>;
}) {
	if (!student) return null;
	return <DetailsGrid student={student} onOpenStudent={onOpenStudent} onTardy={onTardy} details={details} />;
}

export default function Details({ student, onOpenStudent }: DetailsProps) {
	const details = useStudentDetailsData(student);
	const [isTardyModalOpen, setIsTardyModalOpen] = useState(false);

	return (
		<>
			<DetailsError error={details.error} />
			<DetailsBody
				student={student}
				onOpenStudent={onOpenStudent}
				onTardy={() => setIsTardyModalOpen(true)}
				details={details}
			/>
			<TardyModal student={student} isOpen={isTardyModalOpen} onClose={() => setIsTardyModalOpen(false)} />
		</>
	);
}
