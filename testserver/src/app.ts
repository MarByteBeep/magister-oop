import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { GET as getStudentAddress } from './api/leerlingen/adresgegevens';
import { GET as getStudentAgenda } from './api/leerlingen/afspraken';
import { GET as getStudentParents } from './api/leerlingen/ouders';
import { GET as getStudentDetails } from './api/leerlingen/personalia';
import { POST as createReturnMeasure } from './api/leerlingen/verantwoordingen/terugkommaatregelen';
import { GET as getSearchStudents } from './api/leerlingen/zoeken';
import { GET as getReturnMeasures } from './api/m6/leerlingen/terugkomers';
import { GET as getRegistrations } from './api/m6/verantwoordingen/ongeoorloofderegistraties';
import { POST as createAccountability } from './api/medewerkers/afspraken/verantwoordingen';
import { GET as getSearchStaff } from './api/medewerkers/zoeken';
import { GET as getParentAddress } from './api/ouders/adresgegevens';
import { GET as getParentContactDetails } from './api/ouders/contactgegevens';
import { GET as getParentChildren } from './api/ouders/kinderen';
import { GET as getPhoto } from './api/photos/handler';
import { PUT as putReturnMeasureReport } from './api/terugkommaatregelen/melding';
import { GET as getLockersDetails } from './api/v1/lockers/details';
import { GET as getAbsenceNoticesToday } from './api/v2/absence-notices/today';
import { POST as createAbsenceNotice, DELETE as deleteAbsenceNotice } from './api/v2/student/absence-notices';
import { GET as getAttendanceTypes } from './api/v2/student/attendance-types';

const api = new Hono();

api.use('*', cors());

// Stub for frontend; no real account endpoint in testserver
api.get('/account', (c) =>
	c.json({ id: 0, naam: 'Test Account' }, 200, {
		'Content-Type': 'application/json',
	}),
);
// Static routes
api.get('/leerlingen/zoeken', (c) => getSearchStudents(c.req.raw));
api.get('/medewerkers/zoeken', (c) => getSearchStaff(c.req.raw));
api.get('/v1/lockers/details', (c) => getLockersDetails(c.req.raw));
api.get('/v2/absence-notices/today', (c) => getAbsenceNoticesToday(c.req.raw));
api.get('/v2/student/:uuid/attendance-types', (c) => getAttendanceTypes(c.req.raw, c.req.param('uuid')));
api.post('/v2/student/:uuid/absence-notices', (c) => createAbsenceNotice(c.req.raw, c.req.param('uuid')));
api.delete('/v2/student/:uuid/absence-notices/:absenceNoticeId', (c) =>
	deleteAbsenceNotice(c.req.raw, c.req.param('uuid'), c.req.param('absenceNoticeId')),
);
api.get('/m6/verantwoordingen/ongeoorloofderegistraties', (c) => getRegistrations(c.req.raw));
api.get('/m6/leerlingen/terugkomers', (c) => getReturnMeasures(c.req.raw));

// Dynamic: leerlingen /:id /...
api.get('/leerlingen/:id/adresgegevens', (c) => {
	const id = Number.parseInt(c.req.param('id'), 10);
	return getStudentAddress(c.req.raw, id);
});
api.get('/leerlingen/:id/afspraken', (c) => {
	const id = Number.parseInt(c.req.param('id'), 10);
	return getStudentAgenda(c.req.raw, id);
});
api.get('/leerlingen/:id/ouders', (c) => {
	const id = Number.parseInt(c.req.param('id'), 10);
	return getStudentParents(c.req.raw, id);
});
api.get('/leerlingen/:id/personalia', (c) => {
	const id = Number.parseInt(c.req.param('id'), 10);
	return getStudentDetails(c.req.raw, id);
});
api.get('/leerlingen/:id/foto', (c) => {
	const id = Number.parseInt(c.req.param('id'), 10);
	return getPhoto(c.req.raw, id);
});
api.post('/leerlingen/:id/verantwoordingen/terugkommaatregelen', (c) => {
	const id = Number.parseInt(c.req.param('id'), 10);
	return createReturnMeasure(c.req.raw, id);
});

// Dynamic: ouders /:id /...
api.get('/ouders/:id/adresgegevens', (c) => {
	const id = Number.parseInt(c.req.param('id'), 10);
	return getParentAddress(c.req.raw, id);
});
api.get('/ouders/:id/contactgegevens', (c) => {
	const id = Number.parseInt(c.req.param('id'), 10);
	return getParentContactDetails(c.req.raw, id);
});
api.get('/ouders/:id/kinderen', (c) => {
	const id = Number.parseInt(c.req.param('id'), 10);
	return getParentChildren(c.req.raw, id);
});

// Dynamic: medewerkers /:id /foto
api.get('/medewerkers/:id/foto', (c) => {
	const id = Number.parseInt(c.req.param('id'), 10);
	return getPhoto(c.req.raw, id);
});

// Nested: medewerkers/afspraken/:id/verantwoordingen
api.post('/medewerkers/afspraken/:id/verantwoordingen', (c) => {
	const id = Number.parseInt(c.req.param('id'), 10);
	return createAccountability(c.req.raw, id);
});

// Nested: terugkommaatregelen/:id/melding
api.put('/terugkommaatregelen/:id/melding', (c) => {
	const id = Number.parseInt(c.req.param('id'), 10);
	return putReturnMeasureReport(c.req.raw, id);
});

api.notFound((c) => c.json({ error: 'Not Found' }, 404));

const app = new Hono();
app.route('/api', api);

export { app };
