'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
	const fullName = student ? `${student.roepnaam} ${student.tussenvoegsel ?? ''} ${student.achternaam}` : '';

	return (
		<Dialog
			open={studentId !== null && studentId !== undefined}
			onOpenChange={(isOpen: boolean) => !isOpen && onClose()}
		>
			<DialogContent className="w-[1100px] h-[700px] flex flex-col">
				<DialogHeader className="shrink-0">
					<DialogTitle className="text-center">{fullName}</DialogTitle>
					<DialogDescription className="text-center">
						Bekijk gegevens, rooster, verzuim en logboek voor deze leerling.
					</DialogDescription>
				</DialogHeader>

				{/* Scrollable */}
				<div className="flex-1 overflow-y-auto">
					<Tabs defaultValue="gegevens" className="flex flex-col h-full">
						<TabsList className="bg-background sticky top-0 z-10 border-b gap-1 border p-1 w-full shrink-0">
							<TabsTrigger value="gegevens">Gegevens</TabsTrigger>
							<TabsTrigger value="agenda">Rooster</TabsTrigger>
							<TabsTrigger value="verzuim">Verzuim</TabsTrigger>
							<TabsTrigger value="logboek">Logboek</TabsTrigger>
						</TabsList>

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
