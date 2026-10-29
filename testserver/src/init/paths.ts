import { join } from 'node:path';
import { ALL_PHOTOS_DIR, DATA_DIR } from './shared';

export { ALL_PHOTOS_DIR, DATA_DIR };

export const STAFF_MEMBERS_FILE_PATH = join(DATA_DIR, 'staff-members.json');
export const STUDENTS_FILE_PATH = join(DATA_DIR, 'students.json');
export const LOCKERS_FILE_PATH = join(DATA_DIR, 'lockers.json');
export const AGENDA_FILE_PATH = join(DATA_DIR, 'agenda.json');
export const RETURN_MEASURES_FILE_PATH = join(DATA_DIR, 'return-measures.json');
export const ABSENCE_NOTICES_FILE_PATH = join(DATA_DIR, 'absence-notices.json');
