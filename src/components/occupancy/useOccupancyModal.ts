import { useCallback, useState } from 'react';

export function useOccupancyModal() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalLocation, setModalLocation] = useState<string | null>(null);
	const [modalLessonRange, setModalLessonRange] = useState('');

	const openLocationModal = useCallback((location: string, lessonRange: string) => {
		setModalLocation(location);
		setModalLessonRange(lessonRange);
		setIsModalOpen(true);
	}, []);

	const openChartModal = useCallback((lessonRange: string) => {
		setModalLocation(null);
		setModalLessonRange(lessonRange);
		setIsModalOpen(true);
	}, []);

	const closeModal = useCallback(() => {
		setIsModalOpen(false);
		setModalLocation(null);
		setModalLessonRange('');
	}, []);

	return {
		isModalOpen,
		modalLocation,
		modalLessonRange,
		openLocationModal,
		openChartModal,
		closeModal,
	};
}
