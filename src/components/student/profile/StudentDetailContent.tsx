'use client';

import { useEffect, useState } from 'react';
import LazyAvatar from '@/components/LazyAvatar';
import WeeklyAgendaView from '@/components/student/agenda/calendar/WeeklyAgendaView';
import Details from '@/components/student/profile/Details';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentAgendaFocusContext } from '@/context/StudentAgendaFocusContext';
import { getDateKey, parseDateKey } from '@/lib/shared/dateUtils';
import { formatPersonName } from '@/lib/shared/stringUtils';
import type { Student } from '@/types/student.types';

export type StudentDetailTab = 'gegevens' | 'agenda';

export interface StudentDetailContentProps {
	student?: Student;
	onOpenStudent?: (student: Student) => void;
	initialTab?: StudentDetailTab;
	agendaDate?: Date;
}

function studentDisplayName(student: Student | undefined): string {
	if (!student) return '';
	return formatPersonName(student.roepnaam, student.tussenvoegsel, student.achternaam);
}

function studentInitials(student: Student | undefined): string {
	if (!student) return '';
	return `${student.roepnaam.charAt(0)}${student.achternaam.charAt(0)}`.toUpperCase();
}

function agendaFocusDate(agendaDateKey: string | null): Date | undefined {
	if (!agendaDateKey) return undefined;
	return parseDateKey(agendaDateKey);
}

function studentAvatarSrc(student: Student): string | undefined {
	const foto = student.links.foto;
	if (!foto) return undefined;
	return foto.href;
}

function StudentDetailHeaderTitle({ student }: { student: Student | undefined }) {
	const fullName = studentDisplayName(student);
	if (!student) return <span>{fullName}</span>;
	return (
		<>
			<LazyAvatar
				src={studentAvatarSrc(student)}
				alt={fullName}
				initials={studentInitials(student)}
				className="h-10 w-10"
			/>
			<span>{fullName}</span>
		</>
	);
}

function StudentDetailHeader({ student }: { student: Student | undefined }) {
	return (
		<DialogHeader className="shrink-0">
			<DialogTitle className="flex items-center justify-center gap-3 text-center">
				<StudentDetailHeaderTitle student={student} />
			</DialogTitle>
		</DialogHeader>
	);
}

function StudentAgendaTab({
	student,
	onOpenStudent,
	focusDate,
}: {
	student: Student | undefined;
	onOpenStudent?: (student: Student) => void;
	focusDate: Date | undefined;
}) {
	if (!student) return null;
	return <WeeklyAgendaView studentId={student.id} onOpenStudent={onOpenStudent} focusDate={focusDate} />;
}

function StudentDetailTabPanels({
	student,
	onOpenStudent,
	focusDate,
}: {
	student: Student | undefined;
	onOpenStudent?: (student: Student) => void;
	focusDate: Date | undefined;
}) {
	return (
		<div className="flex-1 overflow-y-auto pt-2">
			<TabsContent value="gegevens">
				<Details student={student} onOpenStudent={onOpenStudent} />
			</TabsContent>
			<TabsContent value="agenda">
				<StudentAgendaTab student={student} onOpenStudent={onOpenStudent} focusDate={focusDate} />
			</TabsContent>
			<TabsContent value="verzuim">
				<p>coming soon...</p>
			</TabsContent>
			<TabsContent value="logboek">
				<p>coming soon...</p>
			</TabsContent>
		</div>
	);
}

export default function StudentDetailContent({
	student,
	onOpenStudent,
	initialTab = 'gegevens',
	agendaDate,
}: StudentDetailContentProps) {
	const [tab, setTab] = useState(initialTab);
	const [focusDate, setFocusDate] = useState(agendaDate);
	const agendaDateKey = agendaDate ? getDateKey(agendaDate) : null;

	useEffect(() => {
		setTab(initialTab);
		setFocusDate(agendaFocusDate(agendaDateKey));
	}, [initialTab, agendaDateKey]);

	return (
		<StudentAgendaFocusContext.Provider
			value={(date) => {
				setFocusDate(date);
				setTab('agenda');
			}}
		>
			<StudentDetailHeader student={student} />

			<div className="flex-1 overflow-y-auto">
				<Tabs
					value={tab}
					onValueChange={(value) => setTab(value as StudentDetailTab)}
					className="flex flex-col h-full"
				>
					<div className="sticky top-0 z-10 border-b border-border bg-background">
						<TabsList className="flex h-auto min-h-9 w-full shrink-0 gap-2 rounded-none border-0 bg-transparent p-0 shadow-none">
							<TabsTrigger value="gegevens">Gegevens</TabsTrigger>
							<TabsTrigger value="agenda">Rooster</TabsTrigger>
							<TabsTrigger value="verzuim" disabled>
								Verzuim
							</TabsTrigger>
							<TabsTrigger value="logboek" disabled>
								Logboek
							</TabsTrigger>
						</TabsList>
					</div>

					<StudentDetailTabPanels student={student} onOpenStudent={onOpenStudent} focusDate={focusDate} />
				</Tabs>
			</div>
		</StudentAgendaFocusContext.Provider>
	);
}
