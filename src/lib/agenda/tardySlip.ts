import { formatTime, getNow } from '@/lib/shared/dateUtils';
import templateHtml from '@/templates/tardySlip.html?raw';

export type TardySlipPrintInput = {
	studentName: string;
	lessonInfo: string;
	subject: string;
};

function generateTardySlipHtml(
	data: TardySlipPrintInput & {
		currentDate: string;
		currentTime: string;
	},
): string {
	return templateHtml
		.replace(/\{\{studentName\}\}/g, data.studentName)
		.replace(/\{\{currentDate\}\}/g, data.currentDate)
		.replace(/\{\{currentTime\}\}/g, data.currentTime)
		.replace(/\{\{lessonInfo\}\}/g, data.lessonInfo)
		.replace(/\{\{subject\}\}/g, data.subject);
}

/** Opens the browser print dialog for a te-laat briefje. */
export function printTardySlip(input: TardySlipPrintInput): void {
	const now = getNow();
	const currentTime = formatTime(now);
	const currentDate = now.toLocaleDateString('nl-NL', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});

	const printContent = generateTardySlipHtml({
		...input,
		currentDate,
		currentTime,
	});

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

	setTimeout(() => {
		iframe.contentWindow?.focus();
		iframe.contentWindow?.print();

		const cleanup = () => document.body.removeChild(iframe);
		if (iframe.contentWindow) {
			iframe.contentWindow.onafterprint = cleanup;
		}
		setTimeout(cleanup, 60000);
	}, 250);
}
