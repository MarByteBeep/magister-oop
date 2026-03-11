'use client';

import { LuPrinter } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { formatTime, getNow } from '@/lib/dateUtils';
import type { AgendaItem } from '@/magister/response/agenda.types';
import templateHtml from '@/templates/tardySlip.html?raw';

/** Generates the HTML content for the tardy slip. Edit src/templates/tardySlip.html to change the appearance. */
function generateTardySlipHtml(data: {
	studentName: string;
	currentDate: string;
	currentTime: string;
	lessonInfo: string;
	subject: string;
}): string {
	return templateHtml
		.replace(/\{\{studentName\}\}/g, data.studentName)
		.replace(/\{\{currentDate\}\}/g, data.currentDate)
		.replace(/\{\{currentTime\}\}/g, data.currentTime)
		.replace(/\{\{lessonInfo\}\}/g, data.lessonInfo)
		.replace(/\{\{subject\}\}/g, data.subject);
}

interface TardyConfirmationModalProps {
	item: AgendaItem;
	studentName: string;
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function TardyConfirmationModal({
	item,
	studentName,
	isOpen,
	onConfirm,
	onCancel,
}: TardyConfirmationModalProps) {
	const lessonInfo = item.lesuur?.begin ? `lesuur ${item.lesuur.begin}` : 'deze les';
	const subject = item.onderwerp || 'deze les';

	const handlePrint = () => {
		const now = getNow();
		const currentTime = formatTime(now);
		const currentDate = now.toLocaleDateString('nl-NL', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		});

		// Generate print content from template
		const printContent = generateTardySlipHtml({
			studentName,
			currentDate,
			currentTime,
			lessonInfo,
			subject,
		});

		// Create hidden iframe for printing (avoids popup blockers)
		const iframe = document.createElement('iframe');
		iframe.style.position = 'fixed';
		iframe.style.right = '0';
		iframe.style.bottom = '0';
		iframe.style.width = '0';
		iframe.style.height = '0';
		iframe.style.border = 'none';
		document.body.appendChild(iframe);

		const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
		if (!iframeDoc) {
			document.body.removeChild(iframe);
			return;
		}

		iframeDoc.open();
		iframeDoc.write(printContent);
		iframeDoc.close();

		// Wait for content to render, then print
		setTimeout(() => {
			iframe.contentWindow?.focus();
			iframe.contentWindow?.print();

			// Clean up after print dialog closes
			const cleanup = () => document.body.removeChild(iframe);
			if (iframe.contentWindow) {
				iframe.contentWindow.onafterprint = cleanup;
			}
			// Fallback cleanup after 60 seconds
			setTimeout(cleanup, 60000);
		}, 250);
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
			<DialogContent className="max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Te laat melding aanmaken</DialogTitle>
					<DialogDescription>
						Weet je zeker dat je een te laat melding wilt aanmaken voor {lessonInfo} ({subject})?
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={handlePrint}>
						<LuPrinter className="h-4 w-4" />
						Afdrukken
					</Button>
					<Button variant="outline" onClick={onCancel}>
						Annuleren
					</Button>
					<Button onClick={onConfirm}>OK</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
