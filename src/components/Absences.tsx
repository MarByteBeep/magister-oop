'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LuRefreshCw } from 'react-icons/lu';
import { useAbsencesContext } from '@/context/AbsencesContext';
import { useStudentsContext } from '@/context/StudentsContext';
import { findAgendaItem, getAgendaItemInfo } from '@/lib/agendaUtils';
import { formatTime, getDateKey, getNow, getTodayKey } from '@/lib/dateUtils';
import { createLimiter } from '@/lib/limiter';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { Student } from '@/magister/types';
import LazyAvatar from './LazyAvatar';
import LessonHourBadge from './LessonHourBadge';
import LoadingSpinner from './LoadingSpinner';
import StudentModal from './StudentModal';
import AgendaTooltipContent from './student/AgendaTooltipContent';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

type AbsenceRow = {
	reasonKey: string;
	reasonLabel: string;
	studentId: number;
	studentName: string;
	classCode?: string;
	lesuurBegin?: number;
	lesuurEinde?: number;
	begin?: string;
	einde?: string;
};

function normalizeKey(s: string) {
	return s.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function formatLessonRange(row: AbsenceRow) {
	if (row.lesuurBegin && row.lesuurEinde) {
		return row.lesuurBegin === row.lesuurEinde ? `${row.lesuurBegin}` : `${row.lesuurBegin}-${row.lesuurEinde}`;
	}
	return '-';
}

export default function Absences() {
	const { data, loading, refreshing, error, refresh } = useAbsencesContext();
	const { students, selectedStudies, loadAgendaForStudent } = useStudentsContext();
	const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

	const todayKey = getTodayKey();

	const allowedStudentIds = useMemo(() => {
		// Mirrors the permanent study filters in "Leerlingen".
		if (!selectedStudies.size) {
			return new Set(students.map((s) => s.id));
		}
		return new Set(students.filter((s) => s.studies.some((st) => selectedStudies.has(st))).map((s) => s.id));
	}, [students, selectedStudies]);

	// Throttled agenda loader so Absenties can show lesson details (vak/docent).
	const agendaLimiter = useMemo(() => createLimiter(3, 150), []);
	const [agendaLoadedForStudentIds, setAgendaLoadedForStudentIds] = useState<Set<number>>(new Set());

	// Ensure we have today's agenda loaded for students that appear in absenties,
	// so we can show vak/docent like the agenda overview.
	useEffect(() => {
		if (!data) return;

		const studentMap = new Map(students.map((s) => [s.id, s]));
		const ids = new Set<number>();
		for (const item of data.items ?? []) {
			const student = studentMap.get(item.id);
			if (!student) continue;
			if (!allowedStudentIds.has(student.id)) continue;
			if (student.agenda?.[todayKey]) continue;
			if (agendaLoadedForStudentIds.has(student.id)) continue;
			ids.add(student.id);
		}

		if (ids.size === 0) return;

		let cancelled = false;
		(async () => {
			const now = getNow();
			await Promise.allSettled(
				Array.from(ids).map((id) =>
					agendaLimiter(async () => {
						if (cancelled) return;
						try {
							await loadAgendaForStudent(id, now, now);
						} finally {
							// Mark as attempted to avoid hammering the endpoint.
							setAgendaLoadedForStudentIds((prev) => {
								const next = new Set(prev);
								next.add(id);
								return next;
							});
						}
					}),
				),
			);
		})();

		return () => {
			cancelled = true;
		};
	}, [data, allowedStudentIds, agendaLoadedForStudentIds, agendaLimiter, loadAgendaForStudent, students, todayKey]);

	// Use a ref to stabilize selectedStudent - only update when the student id changes
	// This prevents the modal from re-rendering when students array changes due to agenda loading
	const selectedStudentRef = useRef<Student | undefined>(undefined);
	const selectedStudent: Student | undefined = useMemo(() => {
		if (selectedStudentId == null) {
			selectedStudentRef.current = undefined;
			return undefined;
		}
		const found = students.find((s) => s.id === selectedStudentId);
		// Only update ref if student wasn't found before or id changed
		if (!selectedStudentRef.current || selectedStudentRef.current.id !== selectedStudentId) {
			selectedStudentRef.current = found;
		}
		return selectedStudentRef.current;
	}, [selectedStudentId, students]);

	const grouped = useMemo(() => {
		// Build studentById inside useMemo so it depends directly on students
		// This ensures re-render when student agenda data changes
		const studentById = new Map(students.map((s) => [s.id, s]));

		if (!data)
			return {
				orderedReasons: [] as { key: string; label: string }[],
				byReason: new Map<string, AbsenceRow[]>(),
				studentById,
			};

		// Use filters to define the reason ordering/labels.
		const filters = data.filters?.types ?? [];
		const filterPairs = filters.map((f) => ({ key: normalizeKey(f.name), label: f.name }));

		// Make sure Absent is always first.
		filterPairs.sort((a, b) => {
			const aIsAbsent = a.label.toLowerCase() === 'absent';
			const bIsAbsent = b.label.toLowerCase() === 'absent';
			if (aIsAbsent && !bIsAbsent) return -1;
			if (!aIsAbsent && bIsAbsent) return 1;
			return 0;
		});

		const byReason = new Map<string, AbsenceRow[]>();

		for (const item of data.items ?? []) {
			// Always match UnauthorizedAbsenceItem.id to Student.id.
			// If we can't match (student not loaded), we exclude it so filters can't be bypassed.
			const student = studentById.get(item.id);
			if (!student) continue;

			// Respect permanent "Leerlingen" filters (same selectedStudies logic).
			if (!allowedStudentIds.has(student.id)) continue;

			const studentName = `${student.roepnaam} ${student.tussenvoegsel ?? ''} ${student.achternaam}`
				.replace(/\s+/g, ' ')
				.trim();
			const classCode = student.klassen?.join(', ');

			for (const afspraak of item.afspraken ?? []) {
				for (const v of afspraak.verantwoordingen ?? []) {
					const reasonKey = normalizeKey(v.reden?.type ?? 'unknown');
					const filterLabel =
						filterPairs.find((p) => p.key === reasonKey)?.label ??
						(v.reden?.type ? v.reden.type : 'Onbekend');

					const row: AbsenceRow = {
						reasonKey,
						reasonLabel: filterLabel,
						studentId: item.id,
						studentName,
						classCode,
						lesuurBegin: afspraak.lesuurBegin,
						lesuurEinde: afspraak.lesuurEinde,
						begin: afspraak.begin,
						einde: afspraak.einde,
					};

					const arr = byReason.get(reasonKey) ?? [];
					arr.push(row);
					byReason.set(reasonKey, arr);
				}
			}
		}

		// Sort rows inside each reason.
		for (const arr of byReason.values()) {
			arr.sort((a, b) => {
				// Sort by hour descending (last hour first), then by student name
				const hourA = a.lesuurBegin ?? 0;
				const hourB = b.lesuurBegin ?? 0;
				if (hourA !== hourB) return hourB - hourA;
				return a.studentName.localeCompare(b.studentName);
			});
		}

		// Determine ordered reasons: first from filters, then any unknown ones found.
		const knownKeys = new Set(filterPairs.map((p) => p.key));
		const extraKeys = Array.from(byReason.keys()).filter((k) => !knownKeys.has(k));
		const orderedReasons = [
			...filterPairs.filter((p) => byReason.has(p.key)),
			...extraKeys.map((k) => ({ key: k, label: (byReason.get(k)?.[0]?.reasonLabel ?? k) as string })),
		];

		return { orderedReasons, byReason, studentById };
	}, [data, allowedStudentIds, students]);

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

			{grouped.orderedReasons.length === 0 ? (
				<p className="text-sm text-muted-foreground">Geen absenties gevonden.</p>
			) : (
				grouped.orderedReasons.map(({ key, label }) => {
					const rows = grouped.byReason.get(key) ?? [];
					if (!rows.length) return null;

					return (
						<Card key={key} className="text-left">
							<CardHeader className="py-3">
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg flex items-center gap-2">
										{label} <Badge variant="secondary">{rows.length}</Badge>
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									{rows.map((row, idx) => {
										const student = grouped.studentById.get(row.studentId);
										const clickable = Boolean(student);
										const initials = row.studentName
											.split(' ')
											.filter(Boolean)
											.slice(0, 2)
											.map((p) => p.charAt(0))
											.join('')
											.toUpperCase();

										let agendaItem: AgendaItem | null = null;
										if (student && row.begin) {
											const beginDate = new Date(row.begin);
											if (!Number.isNaN(beginDate.getTime())) {
												const dateKey = getDateKey(beginDate);
												const agendaForDay = student.agenda?.[dateKey];

												if (agendaForDay && agendaForDay.length > 0) {
													// Prefer matching by lesson hour when available (more robust than time matching),
													// then fall back to time-based matching.
													if (row.lesuurBegin) {
														const lesuurBegin = row.lesuurBegin;
														const lesuurEinde = row.lesuurEinde ?? lesuurBegin;
														agendaItem =
															agendaForDay.find(
																(it) => it.lesuur?.begin === lesuurBegin,
															) ??
															agendaForDay.find(
																(it) =>
																	it.lesuur?.begin &&
																	it.lesuur?.einde &&
																	it.lesuur.begin <= lesuurBegin &&
																	it.lesuur.einde >= lesuurEinde,
															) ??
															null;
													}

													if (!agendaItem) {
														agendaItem = findAgendaItem(beginDate, agendaForDay);
													}
												}
											}
										}

										const beginTime = row.begin
											? (() => {
													const d = new Date(row.begin);
													return !Number.isNaN(d.getTime()) ? d : null;
												})()
											: null;
										const endTime = row.einde
											? (() => {
													const d = new Date(row.einde);
													return !Number.isNaN(d.getTime()) ? d : null;
												})()
											: null;
										const { courseCodes, teachersCodes, subject } = agendaItem
											? getAgendaItemInfo(agendaItem)
											: { courseCodes: undefined, teachersCodes: undefined, subject: undefined };

										return (
											<button
												key={`${row.studentId}-${row.lesuurBegin}-${row.lesuurEinde}-${idx}`}
												type="button"
												disabled={!clickable}
												className={[
													'flex items-center justify-between gap-3 p-2 border rounded-md bg-muted/50 text-left',
													clickable
														? 'hover:bg-muted cursor-pointer'
														: 'opacity-60 cursor-not-allowed',
												].join(' ')}
												onClick={() => {
													if (student) setSelectedStudentId(student.id);
												}}
											>
												<div className="flex items-center gap-3 min-w-0">
													<LazyAvatar
														src={student?.links.foto?.href || undefined}
														alt={row.studentName}
														initials={initials}
														className="h-10 w-10"
													/>
													<div className="flex flex-col min-w-0">
														<span className="font-medium text-foreground truncate">
															{row.studentName}{' '}
															{row.classCode ? (
																<span className="text-muted-foreground">
																	({row.classCode})
																</span>
															) : null}
														</span>
													</div>
												</div>
												{agendaItem ? (
													<Tooltip>
														<TooltipTrigger asChild>
															<div className="flex items-center gap-1.5 shrink-0 max-w-[45%] overflow-hidden">
																{row.lesuurBegin ? (
																	<LessonHourBadge
																		lessonInfo={{
																			status: 'lesson',
																			lesson: row.lesuurBegin,
																		}}
																		className="h-5 w-5 text-xs shrink-0"
																	/>
																) : null}
																{beginTime && endTime ? (
																	<span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
																		{formatTime(beginTime)}-{formatTime(endTime)}
																	</span>
																) : null}
																<span className="text-xs font-semibold text-foreground truncate">
																	{courseCodes ?? subject ?? ''}
																</span>
																{teachersCodes ? (
																	<span className="text-xs text-muted-foreground truncate">
																		{teachersCodes}
																	</span>
																) : null}
															</div>
														</TooltipTrigger>
														<TooltipContent>
															<AgendaTooltipContent item={agendaItem} />
														</TooltipContent>
													</Tooltip>
												) : (
													<Badge variant="secondary" className="shrink-0 max-w-[45%]">
														les {formatLessonRange(row)}
													</Badge>
												)}
											</button>
										);
									})}
								</div>

								{rows.some((r) => !grouped.studentById.has(r.studentId)) ? (
									<p className="text-xs text-muted-foreground pt-3">
										Sommige leerlingen zijn nog niet geladen in de leerlingenlijst, dus die zijn
										(nog) niet klikbaar.
									</p>
								) : null}
							</CardContent>
						</Card>
					);
				})
			)}

			{selectedStudent && <StudentModal student={selectedStudent} onClose={() => setSelectedStudentId(null)} />}
		</div>
	);
}
