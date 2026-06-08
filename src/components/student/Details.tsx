'use client';

import { useState } from 'react';
import { LuClock, LuHeartPulse, LuUserX } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudentDetailsData } from '@/hooks/useStudentDetailsData';
import type { Student } from '@/magister/types';
import StudentAgendaCard from './StudentAgendaCard';
import StudentParentsCard from './StudentParentsCard';
import StudentProfileCard from './StudentProfileCard';
import TardyModal from './TardyModal';

interface DetailsProps {
	student?: Student;
	onOpenStudent?: (student: Student) => void;
}

export default function Details({ student, onOpenStudent }: DetailsProps) {
	const {
		personalDetails,
		address,
		photoBlobUrl,
		parentContacts,
		loadingPersonalDetails,
		loadingAddress,
		loadingParentContacts,
		error,
	} = useStudentDetailsData(student);
	const [isTardyModalOpen, setIsTardyModalOpen] = useState(false);

	const fullName = student ? `${student.roepnaam} ${student.tussenvoegsel ?? ''} ${student.achternaam}` : '';
	const initials = student ? `${student.roepnaam.charAt(0)}${student.achternaam.charAt(0)}`.toUpperCase() : '';
	const photoHref = student?.links.foto?.href;

	return (
		<>
			{error && <p className="text-red-500 text-center my-4">{error}</p>}
			{student && (
				<div className="grid gap-4 md:grid-cols-3 grid-rows-[120px_auto]">
					<StudentProfileCard
						student={student}
						fullName={fullName}
						initials={initials}
						photoHref={photoHref}
						photoBlobUrl={photoBlobUrl}
						personalDetails={personalDetails}
						address={address}
						loadingPersonalDetails={loadingPersonalDetails}
						loadingAddress={loadingAddress}
					/>

					<Card className="col-start-2">
						<CardHeader>
							<CardTitle>Snelle acties</CardTitle>
						</CardHeader>
						<CardContent className="grid grid-cols-3 items-center gap-2 mt-1">
							<Button variant="outline" size="sm" disabled onClick={() => console.log('Ziek clicked')}>
								<LuHeartPulse className="h-4 w-4" /> Ziek
							</Button>
							<Button variant="outline" size="sm" onClick={() => setIsTardyModalOpen(true)}>
								<LuClock className="h-4 w-4" /> Te Laat
							</Button>
							<Button variant="outline" size="sm" disabled onClick={() => console.log('Afwezig clicked')}>
								<LuUserX className="h-4 w-4" /> Afwezig
							</Button>
						</CardContent>
					</Card>

					<StudentParentsCard parentContacts={parentContacts} loadingParentContacts={loadingParentContacts} />

					<StudentAgendaCard student={student} onOpenStudent={onOpenStudent} />
				</div>
			)}

			<TardyModal student={student} isOpen={isTardyModalOpen} onClose={() => setIsTardyModalOpen(false)} />
		</>
	);
}
