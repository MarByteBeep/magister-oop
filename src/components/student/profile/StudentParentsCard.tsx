'use client';

import { LuMail, LuPhone, LuSmartphone } from 'react-icons/lu';
import GenderIcon from '@/components/student/GenderIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MailAddress } from '@/components/ui/mail-address';
import { PhoneNumber } from '@/components/ui/phone-number';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { ParentContact } from '@/hooks/students/useStudentDetailsData';
import type { ContactItem } from '@/magister/response/contact.types';

export interface StudentParentsCardProps {
	parentContacts: ParentContact[];
	loadingParentContacts: boolean;
}

function ParentsLoadingSkeleton() {
	return (
		<div className="space-y-2">
			<Skeleton className="h-4 w-32" />
			<Skeleton className="h-3 w-24" />
			<Skeleton className="h-3 w-20" />
			<Skeleton className="h-4 w-32" />
			<Skeleton className="h-3 w-24" />
			<Skeleton className="h-3 w-20" />
		</div>
	);
}

function ParentTypeLabel({ verzorgerType }: { verzorgerType: string | null | undefined }) {
	if (!verzorgerType) return null;
	return <>({verzorgerType})</>;
}

function ParentGender({ geslacht }: { geslacht: ParentContact['geslacht'] }) {
	if (!geslacht) return null;
	return <GenderIcon gender={geslacht} />;
}

function PhoneContactLine({ phoneNumber }: { phoneNumber: string }) {
	const Icon = phoneNumber.startsWith('06') ? LuSmartphone : LuPhone;
	return (
		<>
			<Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
			<PhoneNumber phoneNumber={phoneNumber} />
		</>
	);
}

function ParentPhoneContact({ contact }: { contact: ContactItem & { type: 'telefoonnummer' } }) {
	if (!contact.telefoonnummer) return null;
	return <PhoneContactLine phoneNumber={contact.telefoonnummer} />;
}

function ParentEmailContact({ contact }: { contact: ContactItem & { type: 'emailadres' } }) {
	if (!contact.emailadres) return null;
	return (
		<>
			<LuMail className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
			<MailAddress address={contact.emailadres} />
		</>
	);
}

function ParentContactLine({ contact }: { contact: ContactItem }) {
	if (contact.type === 'telefoonnummer') {
		return (
			<div className="text-sm flex items-start gap-2">
				<ParentPhoneContact contact={contact} />
			</div>
		);
	}
	if (contact.type === 'emailadres') {
		return (
			<div className="text-sm flex items-start gap-2">
				<ParentEmailContact contact={contact} />
			</div>
		);
	}
	return null;
}

function ParentContactsList({ contacts }: { contacts: ContactItem[] }) {
	if (contacts.length === 0) {
		return <p className="text-muted-foreground text-sm">Geen contactgegevens beschikbaar</p>;
	}
	return contacts.map((contact) => <ParentContactLine key={contact.id} contact={contact} />);
}

function ParentRow({ parent }: { parent: ParentContact }) {
	return (
		<div className="mb-4">
			<h3 className="font-medium text-foreground flex items-center gap-2">
				{parent.parentName}
				<span className="text-sm text-muted-foreground flex items-center gap-1">
					<ParentTypeLabel verzorgerType={parent.verzorgerType} />
					<ParentGender geslacht={parent.geslacht} />
				</span>
			</h3>
			<div className="ml-2 mt-1 space-y-1">
				<ParentContactsList contacts={parent.contacts} />
			</div>
		</div>
	);
}

function ParentsList({ parentContacts }: { parentContacts: ParentContact[] }) {
	return parentContacts.map((parent) => <ParentRow key={parent.id} parent={parent} />);
}

function ParentsScrollContent({ parentContacts, loadingParentContacts }: StudentParentsCardProps) {
	if (loadingParentContacts) return <ParentsLoadingSkeleton />;
	return <ParentsList parentContacts={parentContacts} />;
}

export default function StudentParentsCard({ parentContacts, loadingParentContacts }: StudentParentsCardProps) {
	return (
		<Card className="col-start-2">
			<CardHeader>
				<CardTitle>Ouders</CardTitle>
			</CardHeader>
			<CardContent>
				<ScrollArea className="h-[300px]">
					<ParentsScrollContent
						parentContacts={parentContacts}
						loadingParentContacts={loadingParentContacts}
					/>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
