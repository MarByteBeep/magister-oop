'use client';

import { useMemo, useRef, useState } from 'react';
import { LuRefreshCw } from 'react-icons/lu';
import AbsenceGroupList from '@/components/absences/AbsenceGroupList';
import { useAbsencesContext } from '@/context/AbsencesContext';
import { useStudentsContext } from '@/context/StudentsContext';
import { useAbsenceAgendaLoader } from '@/hooks/useAbsenceAgendaLoader';
import { useAllowedStudentIds } from '@/hooks/useAllowedStudentIds';
import { useGroupedAbsences } from '@/hooks/useGroupedAbsences';
import { getTodayKey } from '@/lib/dateUtils';
import type { Student } from '@/magister/types';
import LoadingSpinner from './LoadingSpinner';
import StudentModal from './StudentModal';
import { Button } from './ui/button';

export default function Absences() {
	const { data, loading, refreshing, error, refresh } = useAbsencesContext();
	const { students, selectedStudies, loadAgendaForStudent } = useStudentsContext();
	const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

	const todayKey = getTodayKey();
	const allowedStudentIds = useAllowedStudentIds(students, selectedStudies);

	useAbsenceAgendaLoader(data, students, allowedStudentIds, todayKey, loadAgendaForStudent);

	const selectedStudentRef = useRef<Student | undefined>(undefined);
	const selectedStudent: Student | undefined = useMemo(() => {
		if (selectedStudentId == null) {
			selectedStudentRef.current = undefined;
			return undefined;
		}
		const found = students.find((s) => s.id === selectedStudentId);
		if (!selectedStudentRef.current || selectedStudentRef.current.id !== selectedStudentId) {
			selectedStudentRef.current = found;
		}
		return selectedStudentRef.current;
	}, [selectedStudentId, students]);

	const grouped = useGroupedAbsences(data, students, allowedStudentIds);

	if (loading) {
		return (
			<div className="py-10">
				<LoadingSpinner />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center gap-2 py-10">
				<p className="text-sm text-destructive">Fout bij laden absenties: {error}</p>
				<Button onClick={refresh}>Opnieuw proberen</Button>
			</div>
		);
	}

	if (!data) {
		return <p className="text-sm text-muted-foreground">Geen data.</p>;
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<h2 className="text-lg font-semibold">Absenties</h2>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={refresh}
					disabled={refreshing}
					aria-label="Ververs absenties"
					title="Ververs"
				>
					<LuRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
				</Button>
			</div>

			<AbsenceGroupList
				orderedReasons={grouped.orderedReasons}
				byReason={grouped.byReason}
				studentById={grouped.studentById}
				onSelectStudent={setSelectedStudentId}
			/>

			{selectedStudent && <StudentModal student={selectedStudent} onClose={() => setSelectedStudentId(null)} />}
		</div>
	);
}
