'use client';

import { asyncFetchStatus } from '@/components/AsyncFetchStatus';
import RegistrationCategoryFilter from '@/components/registrations/RegistrationCategoryFilter';
import RegistrationGroupList from '@/components/registrations/RegistrationGroupList';
import SyncButton from '@/components/SyncButton';
import { useRegistrationsViewModel } from '@/hooks/registrations/useRegistrationsViewModel';
import type { Student } from '@/types/student.types';
import StudentModal from './StudentModal';

function RegistrationsStudentModal({ student, onClose }: { student: Student | undefined; onClose: () => void }) {
	if (!student) return null;
	return <StudentModal student={student} onClose={onClose} />;
}

export default function Registrations() {
	const vm = useRegistrationsViewModel();
	const fetchStatus = asyncFetchStatus({
		loading: vm.loading,
		error: vm.error,
		errorMessage: 'Fout bij laden registraties',
		onRetry: vm.refresh,
	});
	if (fetchStatus) return fetchStatus;
	if (!vm.data) return <p className="text-sm text-muted-foreground">Geen data.</p>;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between gap-2">
				<RegistrationCategoryFilter
					value={vm.activeCategory}
					categories={vm.categories}
					onChange={vm.setCategory}
				/>
				<SyncButton
					kind="plain"
					label="Ververs registraties"
					busy={vm.refreshing}
					toast="Registraties gesynchroniseerd"
					errorToast="Registraties synchroniseren mislukt"
					onSync={vm.refresh}
				/>
			</div>

			<RegistrationGroupList
				orderedReasons={vm.visibleReasons}
				byReason={vm.grouped.byReason}
				studentById={vm.grouped.studentById}
				onSelectStudent={vm.setSelectedStudentId}
			/>

			<RegistrationsStudentModal student={vm.selectedStudent} onClose={() => vm.setSelectedStudentId(null)} />
		</div>
	);
}
