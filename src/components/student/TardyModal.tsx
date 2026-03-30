'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import LazyAvatar from '@/components/LazyAvatar';
import LessonHourBadge from '@/components/LessonHourBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useStudentsContext } from '@/context/StudentsContext';
import { useCurrentTime } from '@/hooks/useCurrentTime';
import { findAgendaItem, getAgendaItemInfo } from '@/lib/agendaUtils';
import { formatTime, getDateKey, getNow } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import { postJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { CreateAccountabilityRequest } from '@/magister/response/accountability.types';
import type { AgendaItem } from '@/magister/response/agenda.types';
import type { Student } from '@/magister/types';
import AgendaTooltipContent from './AgendaTooltipContent';
import TardyConfirmationModal from './TardyConfirmationModal';

interface TardyModalProps {
	student?: Student;
	isOpen: boolean;
	onClose: () => void;
}

export default function TardyModal({ student, isOpen, onClose }: TardyModalProps) {
	const { students, loadAgendaForStudent } = useStudentsContext();
	const currentTime = useCurrentTime();
	const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);
	const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

	const studentId = student?.id;

	useEffect(() => {
		if (!isOpen || !studentId) {
			setAgendaItems([]);
			setIsLoading(false);
			return;
		}

		let cancelled = false;

		// Calculate today's date inside the effect
		const today = getNow();
		const todayKey = getDateKey(today);

		// Check if agenda is already loaded for today
		const studentFromContext = students.find((s) => s.id === studentId);
		const agendaForToday = studentFromContext?.agenda?.[todayKey];

		if (agendaForToday) {
			if (!cancelled) {
				setAgendaItems(agendaForToday);
				setIsLoading(false);
			}
		} else {
			// Load agenda for today
			setIsLoading(true);
			loadAgendaForStudent(studentId, today, today)
				.then(({ items }) => {
					if (!cancelled) {
						setAgendaItems(items);
					}
				})
				.catch((err) => {
					if (!cancelled) {
						console.error('Failed to load agenda:', err);
						setAgendaItems([]);
					}
				})
				.finally(() => {
					if (!cancelled) {
						setIsLoading(false);
					}
				});
		}

		return () => {
			cancelled = true;
		};
	}, [isOpen, studentId, students, loadAgendaForStudent]);

	const fullName = student ? `${student.roepnaam} ${student.tussenvoegsel ?? ''} ${student.achternaam}`.trim() : '';

	// Find current agenda item
	const activeAgendaItem = findAgendaItem(currentTime, agendaItems);

	const handleItemClick = (item: AgendaItem) => {
		setSelectedItem(item);
		setIsConfirmationOpen(true);
	};

	const handleConfirm = async () => {
		if (!selectedItem || !studentId) return;

		try {
			const payload: CreateAccountabilityRequest = {
				persoonId: studentId,
				redenId: 4,
				opmerking: '',
			};

			const url = endpoints.createAccountability(selectedItem.id);
			const result = await postJson(url, payload);

			if (!result.ok) {
				toast.error('Fout bij het aanmaken van de te laat melding', {
					description: result.error,
				});
				return;
			}

			if (result.status !== 204) {
				toast.error('Onverwachte fout bij het aanmaken van de te laat melding', {
					description: `Verwachte status 204, maar kreeg ${result.status}`,
				});
				return;
			}

			toast.success('Te laat melding succesvol aangemaakt');
			setIsConfirmationOpen(false);
			setSelectedItem(null);
		} catch (err) {
			toast.error('Fout bij het aanmaken van de te laat melding', {
				description: err instanceof Error ? err.message : 'Onbekende fout',
			});
		}
	};

	const handleCancel = () => {
		setIsConfirmationOpen(false);
		setSelectedItem(null);
	};

	return (
		<>
			<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
				<DialogContent
					className="max-w-[500px] max-h-[500px] flex flex-col"
					onOpenAutoFocus={(e) => e.preventDefault()}
				>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-3">
							{student && (
								<LazyAvatar
									src={student.links.foto?.href || undefined}
									alt={fullName}
									initials={`${student.roepnaam.charAt(0)}${student.achternaam.charAt(0)}`.toUpperCase()}
									className="h-10 w-10"
								/>
							)}
							<span>{fullName} - Te laat melding</span>
						</DialogTitle>
						<DialogDescription>
							Overzicht van alle afspraken voor vandaag met lesuur en onderwerp.
						</DialogDescription>
					</DialogHeader>

					{isLoading ? (
						<div className="flex justify-center items-center py-8">
							<LoadingSpinner iconClassName="h-6 w-6" />
						</div>
					) : agendaItems.length === 0 ? (
						<p className="text-muted-foreground text-center py-8">Geen afspraken voor vandaag</p>
					) : (
						<ScrollArea className="flex-1 pr-4 min-h-0">
							<div className="grid grid-cols-2 gap-2">
								{[...agendaItems]
									.sort((a, b) => (a.lesuur?.begin ?? 99) - (b.lesuur?.begin ?? 99))
									.map((item) => {
										const beginTime = new Date(item.begin);
										const endTime = new Date(item.einde);
										const { locations, courseDescriptions, subject, teachersCodes } =
											getAgendaItemInfo(item);
										const isPast = beginTime <= currentTime;
										const isCurrent = activeAgendaItem?.id === item.id;

										// Build second line: time, location, teacher(s)
										const secondLineParts = [
											`${formatTime(beginTime)}-${formatTime(endTime)}`,
											locations,
											teachersCodes,
										].filter(Boolean);

										return (
											<Tooltip key={item.id}>
												<TooltipTrigger asChild>
													<button
														type="button"
														disabled={!isPast}
														onClick={() => handleItemClick(item)}
														className={cn(
															'relative flex items-start gap-2 p-2.5 border rounded-md transition-all duration-150 text-left',
															isCurrent
																? 'bg-card-foreground/30 border-primary cursor-default'
																: isPast
																	? 'bg-card hover:bg-accent hover:border-primary/50 hover:shadow-sm cursor-pointer'
																	: 'bg-muted/30 border-muted opacity-60 cursor-not-allowed',
														)}
													>
														{isCurrent && (
															<Badge
																variant="default"
																className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[0.6rem] px-1 py-0 z-10"
															>
																Nu
															</Badge>
														)}
														<div className="flex flex-col gap-0.5 items-start flex-1 min-w-0">
															<div className="flex items-center gap-0.5 w-full">
																{item.lesuur?.begin && (
																	<LessonHourBadge
																		lessonInfo={{
																			status: 'lesson',
																			lesson: item.lesuur.begin,
																		}}
																		className="h-4 w-4 text-[0.6rem] shrink-0"
																	/>
																)}
																<span
																	className={cn(
																		'font-semibold truncate',
																		!isPast && 'text-muted-foreground',
																	)}
																>
																	{courseDescriptions ?? subject}
																</span>
															</div>
															<span className="text-[0.6rem] text-muted-foreground truncate text-left">
																{secondLineParts.join(' · ')}
															</span>
														</div>
													</button>
												</TooltipTrigger>
												<TooltipContent>
													<AgendaTooltipContent item={item} />
												</TooltipContent>
											</Tooltip>
										);
									})}
							</div>
						</ScrollArea>
					)}
				</DialogContent>
			</Dialog>

			{selectedItem && (
				<TardyConfirmationModal
					item={selectedItem}
					studentName={fullName}
					isOpen={isConfirmationOpen}
					onConfirm={handleConfirm}
					onCancel={handleCancel}
				/>
			)}
		</>
	);
}
