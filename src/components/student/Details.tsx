'use client';

import { useEffect, useState } from 'react';
import { IoFemale, IoMale, IoMaleFemale } from 'react-icons/io5';
import { LuClock, LuHeartPulse, LuMail, LuPhone, LuSmartphone, LuUserX } from 'react-icons/lu';
import { toast } from 'sonner';
import Avatar from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MailAddress } from '@/components/ui/mailaddress';
import { PhoneNumber } from '@/components/ui/phonenumber';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { getOrCreateBlobUrl } from '@/lib/blobUtils';
import { getAge } from '@/lib/dateUtils';
import { getJson } from '@/magister/api';
import { endpoints } from '@/magister/endpoints';
import type { Address, AddressesResponse } from '@/magister/response/address.types';
import type { ContactItem, ContactsResponse } from '@/magister/response/contact.types';
import type { ParentsResponse } from '@/magister/response/parent.types';
import type { StudentDetails } from '@/magister/response/student-details.types';
import type { Student } from '@/magister/types';
import DailyAgendaView from './DailyAgendaView';
import TardyModal from './TardyModal';

interface DetailsProps {
	student?: Student;
}

// Helper function to get gender icon
const getGenderIcon = (gender: string) => {
	const className = 'h-4 w-4';
	switch (gender.toLowerCase()) {
		case 'man':
			return <IoMale className={className} />;
		case 'vrouw':
			return <IoFemale className={className} />;
		default:
			return <IoMaleFemale className={className} />;
	}
};

// Helper function to filter and deduplicate contacts
const filterAndDeduplicateContacts = (contacts: ContactItem[]): ContactItem[] => {
	const uniqueContacts: ContactItem[] = [];
	const seenValues = new Set<string>();

	contacts.forEach((contact) => {
		let value: string | null = null;

		if (contact.type === 'telefoonnummer') {
			value = contact.telefoonnummer;
		} else if (contact.type === 'emailadres') {
			value = contact.emailadres;
		}

		// Only add if value exists and hasn't been seen before
		if (value && !seenValues.has(value)) {
			seenValues.add(value);
			uniqueContacts.push(contact);
		}
	});

	return uniqueContacts;
};

export default function Details({ student }: DetailsProps) {
	const [personalDetails, setPersonalDetails] = useState<StudentDetails | undefined>(undefined);
	const [address, setAddress] = useState<Address | undefined>(undefined);
	const [photoBlobUrl, setPhotoBlobUrl] = useState<string | undefined>(undefined);
	const [parentContacts, setParentContacts] = useState<
		{ parentName: string; verzorgerType?: string | null; geslacht: string; contacts: ContactItem[]; id: number }[]
	>([]);
	const [loadingPersonalDetails, setLoadingPersonalDetails] = useState(true);
	const [loadingAddress, setLoadingAddress] = useState(true);
	const [loadingParentContacts, setLoadingParentContacts] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isTardyModalOpen, setIsTardyModalOpen] = useState(false);

	const studentId = student?.id;
	const fullName = student ? `${student.roepnaam} ${student.tussenvoegsel ?? ''} ${student.achternaam}` : '';
	const initials = student ? `${student.roepnaam.charAt(0)}${student.achternaam.charAt(0)}`.toUpperCase() : '';
	const photoHref = student?.links.foto?.href;

	useEffect(() => {
		if (studentId === null || studentId === undefined || student === null) {
			setPersonalDetails(undefined);
			setPhotoBlobUrl(undefined);
			setLoadingPersonalDetails(false);
			setLoadingAddress(false);
			setAddress(undefined);
			setError(null);
			setParentContacts([]);
			setLoadingParentContacts(false);
			return;
		}

		let isCancelled = false;

		const fetchAllData = async () => {
			// Reset states for new student
			setPersonalDetails(undefined);
			setPhotoBlobUrl(undefined);
			setLoadingPersonalDetails(true);
			setLoadingAddress(true);
			setAddress(undefined);
			setError(null);
			setParentContacts([]);
			setLoadingParentContacts(true);

			try {
				// --- Fetch Photo (using shared cache) ---
				if (photoHref) {
					const photoUrl = await getOrCreateBlobUrl(photoHref);
					if (!isCancelled) {
						setPhotoBlobUrl(photoUrl); // Set photo URL as soon as it's available
					}
				}

				{
					const data = await getJson<StudentDetails>(endpoints.studentPersonalDetails(studentId));
					if (isCancelled) return;
					setPersonalDetails(data);
					setLoadingPersonalDetails(false);
				}

				{
					const data = await getJson<AddressesResponse>(endpoints.studentAddress(studentId));
					if (isCancelled) return;
					setAddress(data.items.find((t) => t.type === 'woon'));
					setLoadingAddress(false);
				}

				// Fetch parent contact information
				const parentsResponse = await getJson<ParentsResponse>(endpoints.studentParents(studentId));
				if (isCancelled) return;

				const parentContactPromises = parentsResponse.items.map(async (parent) => {
					const parentName = `${parent.voorletters} ${parent.tussenvoegsel ? parent.tussenvoegsel + ' ' : ''}${parent.achternaam}`;
					try {
						const contactDetailsResponse = await getJson<ContactsResponse>(
							endpoints.parentContactDetails(parent.id),
						);
						const filteredContacts = filterAndDeduplicateContacts(contactDetailsResponse.items);

						return {
							id: parent.id, // Add parent ID here
							parentName,
							verzorgerType: parent.verzorgerType,
							geslacht: parent.geslacht,
							contacts: filteredContacts,
						};
					} catch (err) {
						console.error(`Error fetching contact details for parent ${parent.id}:`, err);
						return {
							id: parent.id,
							parentName,
							verzorgerType: parent.verzorgerType,
							geslacht: parent.geslacht,
							contacts: [],
						};
					}
				});

				const parentContactsData = await Promise.all(parentContactPromises);
				if (!isCancelled) {
					setParentContacts(parentContactsData);
					setLoadingParentContacts(false);
				}
			} catch (err) {
				if (isCancelled) return;
				console.error('Error fetching student details:', err);

				// Check if it's a quota error
				if (err instanceof Error && err.name === 'StorageQuotaExceededError') {
					// Use id to prevent duplicate toasts - same id will update existing toast
					toast.error('Opslaglimiet bereikt', {
						id: 'storage-quota-exceeded',
						description:
							'De sessieopslag is vol. Sluit browser en open de extensie opnieuw om ruimte vrij te maken.',
						duration: Infinity,
					});
				} else {
					setError('Fout bij het laden van leerlingdetails.');
				}
				setLoadingParentContacts(false);
			}
		};

		fetchAllData();

		return () => {
			isCancelled = true;
			// object URLs are managed by blobUtils cache, no need to revoke here
		};
	}, [studentId, photoHref, student]);

	const fullAddress = `${address?.straat} ${address?.huisnummer}${address?.toevoeging ?? ''} ${address?.plaats}`;

	const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

	const dob = personalDetails ? new Date(personalDetails.geboortedatum) : undefined;

	return (
		<>
			{error && <p className="text-red-500 text-center my-4">{error}</p>}
			{student && (
				<div className="grid gap-4 md:grid-cols-3 grid-rows-[120px_auto]">
					<Card className="row-span-2 col-start-1 row-start-1">
						<CardHeader>
							<div className="flex flex-col items-center justify-center pb-6">
								{/* Show skeleton for avatar only if photoHref exists but photoBlobUrl is not yet available */}
								{photoHref && !photoBlobUrl ? (
									<Skeleton className="h-24 w-24 rounded-full" />
								) : (
									<Avatar
										src={photoBlobUrl} // This will be set immediately if cached, or after fetch
										alt={fullName}
										initials={initials}
										className="h-48 w-48 text-6xl "
									/>
								)}
							</div>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-[1fr_2fr] gap-2">
								<span className="text-sm font-medium text-muted-foreground">Naam</span>
								<span className="text-sm truncate text-foreground flex items-center gap-1">
									{fullName}
									<span className="text-muted-foreground truncate">
										{personalDetails ? getGenderIcon(personalDetails.geslacht) : ''}
									</span>
								</span>

								<span className="text-sm font-medium text-muted-foreground">Klas</span>
								<span className="text-sm text-foreground">{student.klassen.join(', ')}</span>

								<span className="text-sm font-medium text-muted-foreground">E-mail</span>

								<MailAddress address={student.emailadres} />

								{student.telefoonnummer && (
									<>
										<span className="text-sm font-medium text-muted-foreground">Telefoon</span>
										<PhoneNumber phoneNumber={student.telefoonnummer} />
									</>
								)}

								<span className="text-sm font-medium text-muted-foreground">Kluisje</span>
								<span className="text-sm text-foreground">{student.lockerCode || '-'}</span>

								{/* Displaying fields from fetched personalia or skeleton loaders */}
								{loadingPersonalDetails ? (
									<>
										<span className="text-sm font-medium text-muted-foreground">Geboren</span>
										<Skeleton className="h-4 w-24" />

										<span className="text-sm font-medium text-muted-foreground">Woonsituatie</span>
										<Skeleton className="h-4 w-24" />
									</>
								) : (
									personalDetails && (
										<>
											<span className="text-sm font-medium text-muted-foreground">Leeftijd</span>
											<span className="text-sm text-foreground flex flex-col">
												<span>{dob ? `${getAge(dob)} jaar` : '-'}</span>

												<span className="text-xs text-muted-foreground">
													{dob?.toLocaleDateString('nl-NL', {
														day: 'numeric',
														month: 'long',
														year: 'numeric',
													})}
													, {personalDetails.geboorteplaats ?? '-'}
												</span>
											</span>

											<span className="text-sm font-medium text-muted-foreground">
												Woonsituatie
											</span>
											<span className="text-sm text-foreground">
												{personalDetails.woonsituatie?.omschrijving ?? '-'}
											</span>
										</>
									)
								)}
								{loadingAddress ? (
									<>
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-4 w-16" />
									</>
								) : (
									address && (
										<>
											<span className="text-sm font-medium text-muted-foreground">Adres</span>
											<span className="text-sm text-foreground">
												<a
													href={googleMapsUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="text-foreground underline"
												>
													<div>
														{address.straat} {address.huisnummer}
														{address.toevoeging ?? ''}
													</div>
													<div>
														{address.postcode} {address.plaats}
													</div>
												</a>
											</span>
										</>
									)
								)}
							</div>
						</CardContent>
					</Card>

					<Card className="col-start-2">
						<CardHeader>
							<CardTitle>Snelle acties</CardTitle>
						</CardHeader>
						<CardContent className="grid grid-cols-3 items-center gap-2 mt-1">
							<Button variant="outline" size="sm" onClick={() => console.log('Ziek clicked')}>
								<LuHeartPulse className="h-4 w-4" /> Ziek
							</Button>
							<Button variant="outline" size="sm" onClick={() => setIsTardyModalOpen(true)}>
								<LuClock className="h-4 w-4" /> Te Laat
							</Button>
							<Button variant="outline" size="sm" onClick={() => console.log('Afwezig clicked')}>
								<LuUserX className="h-4 w-4" /> Afwezig
							</Button>
						</CardContent>
					</Card>

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
													{parent.geslacht && getGenderIcon(parent.geslacht)}
												</span>
											</h3>
											<div className="ml-2 mt-1 space-y-1">
												{parent.contacts.length > 0 ? (
													parent.contacts.map((contact) => (
														<div
															key={contact.id}
															className="text-sm flex items-start gap-2"
														>
															{contact.type === 'telefoonnummer' &&
																contact.telefoonnummer && (
																	<>
																		{contact.telefoonnummer?.startsWith('06') ? (
																			<LuSmartphone className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
																		) : (
																			<LuPhone className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
																		)}
																		<PhoneNumber
																			phoneNumber={contact.telefoonnummer}
																		/>
																	</>
																)}
															{contact.type === 'emailadres' && contact.emailadres && (
																<>
																	<LuMail className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
																	<MailAddress address={contact.emailadres} />
																</>
															)}
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

					<Card className="row-span-2 col-start-3 row-start-1">
						<CardHeader>
							<CardTitle>Agenda</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<DailyAgendaView studentId={student.id} />
						</CardContent>
					</Card>
				</div>
			)}

			<TardyModal student={student} isOpen={isTardyModalOpen} onClose={() => setIsTardyModalOpen(false)} />
		</>
	);
}
