'use client';

import LazyAvatar from '@/components/LazyAvatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Student } from '@/magister/types';
import Details from './student/Details';
import WeeklyAgendaView from './student/WeeklyAgendaView';

interface StudentModalProps {
	student?: Student;
	onClose: () => void;
}

export default function StudentModal({ student, onClose }: StudentModalProps) {
	const studentId = student?.id;
	const fullName = student ? `${student.roepnaam} ${student.tussenvoegsel ?? ''} ${student.achternaam}`.trim() : '';
	const avatarSrc = student?.links.foto?.href || undefined;
	const initials = student ? `${student.roepnaam.charAt(0)}${student.achternaam.charAt(0)}`.toUpperCase() : '';

	return (
		<Dialog
			open={studentId !== null && studentId !== undefined}
			onOpenChange={(isOpen: boolean) => !isOpen && onClose()}
		>
			<DialogContent className="w-[1100px] h-[700px] flex flex-col">
				<DialogHeader className="shrink-0">
					<DialogTitle className="flex items-center justify-center gap-3 text-center">
						{student && (
							<LazyAvatar src={avatarSrc} alt={fullName} initials={initials} className="h-10 w-10" />
						)}
						<span>{fullName}</span>
					</DialogTitle>
				</DialogHeader>

				{/* Scrollable */}
				<div className="flex-1 overflow-y-auto">
					<Tabs defaultValue="gegevens" className="flex flex-col h-full">
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
								<Details student={student} />
							</TabsContent>
							<TabsContent value="agenda">
								{student && <WeeklyAgendaView studentId={student.id} />}
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
			</DialogContent>
		</Dialog>
	);
}
