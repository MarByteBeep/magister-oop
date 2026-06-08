import { useState } from 'react';

export function useOccupancyModal() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalLocation, setModalLocation] = useState('');
	const [modalLessonRange, setModalLessonRange] = useState('');

	const openModal = (location: string, lessonRange: string) => {
		setModalLocation(location);
		setModalLessonRange(lessonRange);
		setIsModalOpen(true);
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setModalLocation('');
		setModalLessonRange('');
	};

	return { isModalOpen, modalLocation, modalLessonRange, openModal, closeModal };
}
