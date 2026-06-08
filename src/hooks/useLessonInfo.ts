import { useEffect, useState } from 'react';
import { getLesson, getNextLesson, type LessonInfo } from '@/lib/agendaUtils';
import { deepEqual } from '@/lib/utils';

export function useLessonInfo(currentTime: Date) {
	const [currentLesson, setCurrentLesson] = useState<LessonInfo>(() => getLesson(currentTime));
	const [nextLesson, setNextLesson] = useState<LessonInfo>(() => getNextLesson(currentLesson));

	useEffect(() => {
		const newCurrent = getLesson(currentTime);
		const newNext = getNextLesson(newCurrent);

		if (!deepEqual(newCurrent, currentLesson)) setCurrentLesson(newCurrent);
		if (!deepEqual(newNext, nextLesson)) setNextLesson(newNext);
	}, [currentTime, currentLesson, nextLesson]);

	return { currentLesson, nextLesson };
}
