'use client';

import { useEffect, useState } from 'react';
import LazyAvatar from '@/components/LazyAvatar';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentAgendaFocusContext } from '@/context/StudentAgendaFocusContext';
import { getDateKey, parseDateKey } from '@/lib/dateUtils';
import type { Student } from '@/types/student.types';
import Details from './Details';
import WeeklyAgendaView from './WeeklyAgendaView';

export type StudentDetailTab = 'gegevens' | 'agenda';

interface StudentDetailContentProps {
	student?: Student;
	onOpenStudent?: (student: Student) => void;
	initialTab?: StudentDetailTab;
	agendaDate?: Date;
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
	const fullName = student ? `${student.roepnaam} ${student.tussenvoegsel ?? ''} ${student.achternaam}`.trim() : '';
	const avatarSrc = student?.links.foto?.href || undefined;
	const initials = student ? `${student.roepnaam.charAt(0)}${student.achternaam.charAt(0)}`.toUpperCase() : '';

	useEffect(() => {
		setTab(initialTab);
		setFocusDate(agendaDateKey ? parseDateKey(agendaDateKey) : undefined);
	}, [initialTab, agendaDateKey]);

	return (
		<StudentAgendaFocusContext.Provider
			value={(date) => {
				setFocusDate(date);
				setTab('agenda');
			}}
		>
			<DialogHeader className="shrink-0">
				<DialogTitle className="flex items-center justify-center gap-3 text-center">
					{student && <LazyAvatar src={avatarSrc} alt={fullName} initials={initials} className="h-10 w-10" />}
					<span>{fullName}</span>
				</DialogTitle>
			</DialogHeader>

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

					<div className="flex-1 overflow-y-auto pt-2">
						<TabsContent value="gegevens">
							<Details student={student} onOpenStudent={onOpenStudent} />
						</TabsContent>
						<TabsContent value="agenda">
							{student && (
								<WeeklyAgendaView
									studentId={student.id}
									onOpenStudent={onOpenStudent}
									focusDate={focusDate}
								/>
							)}
						</TabsContent>
						<TabsContent value="verzuim">
							<p>coming soon...</p>
						</TabsContent>
						<TabsContent value="logboek">
							<p>coming soon...</p>
						</TabsContent>
					</div>
				</Tabs>
			</div>
		</StudentAgendaFocusContext.Provider>
	);
}
