import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AttendanceStaffMember } from '@/magister/response/agenda.types';

interface OccupancyModalMetadataProps {
	subjects: string[];
	teachers: AttendanceStaffMember[];
}

export default function OccupancyModalMetadata({ subjects, teachers }: OccupancyModalMetadataProps) {
	if (subjects.length === 0 && teachers.length === 0) return null;

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
			{subjects.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Vakken</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							{subjects.map((subject) => (
								<Badge key={subject} variant="secondary" className="text-sm">
									{subject}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{teachers.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Docenten</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							{teachers.map((teacher) => (
								<Badge key={teacher.id} variant="secondary" className="text-sm">
									{teacher.roepnaam} {teacher.tussenvoegsel} {teacher.achternaam} ({teacher.code})
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
