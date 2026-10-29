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

function createHiddenPrintIframe(): HTMLIFrameElement {
	const iframe = document.createElement('iframe');
	iframe.style.position = 'fixed';
	iframe.style.right = '0';
	iframe.style.bottom = '0';
	iframe.style.width = '0';
	iframe.style.height = '0';
	iframe.style.border = 'none';
	document.body.appendChild(iframe);
	return iframe;
}

function iframeDocument(iframe: HTMLIFrameElement): Document | null {
	if (iframe.contentDocument) return iframe.contentDocument;
	const contentWindow = iframe.contentWindow;
	if (!contentWindow) return null;
	return contentWindow.document;
}

function schedulePrintCleanup(iframe: HTMLIFrameElement): void {
	const cleanup = () => document.body.removeChild(iframe);
	const contentWindow = iframe.contentWindow;
	if (contentWindow) contentWindow.onafterprint = cleanup;
	setTimeout(cleanup, 60000);
}

function runIframePrint(iframe: HTMLIFrameElement): void {
	iframe.contentWindow?.focus();
	iframe.contentWindow?.print();
	schedulePrintCleanup(iframe);
}

function writeAndPrintIframe(iframe: HTMLIFrameElement, printContent: string): void {
	const iframeDoc = iframeDocument(iframe);
	if (!iframeDoc) {
		document.body.removeChild(iframe);
		return;
	}
	iframeDoc.open();
	iframeDoc.write(printContent);
	iframeDoc.close();
	setTimeout(() => runIframePrint(iframe), 250);
}

/** Opens the browser print dialog for a te-laat briefje. */
export function printTardySlip(input: TardySlipPrintInput): void {
	const now = getNow();
	const printContent = generateTardySlipHtml({
		...input,
		currentDate: now.toLocaleDateString('nl-NL', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		}),
		currentTime: formatTime(now),
	});
	writeAndPrintIframe(createHiddenPrintIframe(), printContent);
}
