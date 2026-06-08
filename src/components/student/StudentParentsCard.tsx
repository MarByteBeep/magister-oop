'use client';

import { LuMail, LuPhone, LuSmartphone } from 'react-icons/lu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MailAddress } from '@/components/ui/mailaddress';
import { PhoneNumber } from '@/components/ui/phonenumber';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { ParentContact } from '@/hooks/useStudentDetailsData';
import GenderIcon from './GenderIcon';

interface StudentParentsCardProps {
	parentContacts: ParentContact[];
	loadingParentContacts: boolean;
}

export default function StudentParentsCard({ parentContacts, loadingParentContacts }: StudentParentsCardProps) {
	return (
		<Card className="col-start-2">
			<CardHeader>
				<CardTitle>Ouders</CardTitle>
			</CardHeader>
			<CardContent>
				<ScrollArea className="h-[300px]">
					{loadingParentContacts ? (
						<div className="space-y-2">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-24" />
							<Skeleton className="h-3 w-20" />
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-24" />
							<Skeleton className="h-3 w-20" />
						</div>
					) : (
						parentContacts.map((parent) => (
							<div key={parent.id} className="mb-4">
								<h3 className="font-medium text-foreground flex items-center gap-2">
									{parent.parentName}
									<span className="text-sm text-muted-foreground flex items-center gap-1">
										{parent.verzorgerType && `(${parent.verzorgerType})`}
										{parent.geslacht ? <GenderIcon gender={parent.geslacht} /> : null}
									</span>
								</h3>
								<div className="ml-2 mt-1 space-y-1">
									{parent.contacts.length > 0 ? (
										parent.contacts.map((contact) => (
											<div key={contact.id} className="text-sm flex items-start gap-2">
												{contact.type === 'telefoonnummer' && contact.telefoonnummer ? (
													<>
														{contact.telefoonnummer?.startsWith('06') ? (
															<LuSmartphone className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
														) : (
															<LuPhone className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
														)}
														<PhoneNumber phoneNumber={contact.telefoonnummer} />
													</>
												) : null}
												{contact.type === 'emailadres' && contact.emailadres ? (
													<>
														<LuMail className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
														<MailAddress address={contact.emailadres} />
													</>
												) : null}
											</div>
										))
									) : (
										<p className="text-muted-foreground text-sm">
											Geen contactgegevens beschikbaar
										</p>
									)}
								</div>
							</div>
						))
					)}
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
