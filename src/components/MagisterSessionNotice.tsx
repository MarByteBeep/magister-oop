import type { MagisterSessionStatus } from '@/lib/session/magisterSession';
import { cn } from '@/lib/utils';

const NOTICES: Record<Exclude<MagisterSessionStatus, 'ready'>, { text: string; className: string }> = {
	checking: {
		text: 'Magister-sessie controleren…',
		className: 'text-muted-foreground',
	},
	connecting: {
		text: 'Magister-sessie verlopen of niet gevonden. Log in in de geopende Magister-tab; de gegevens verschijnen daarna automatisch.',
		className: 'text-muted-foreground',
	},
	cancelled: {
		text: 'Inloggen op Magister is afgebroken. Klik opnieuw op het extensie-icoon.',
		className: 'text-destructive',
	},
};

export function MagisterSessionNotice({ session }: { session: Exclude<MagisterSessionStatus, 'ready'> }) {
	const notice = NOTICES[session];
	return (
		<div className="flex min-h-[400px] items-center justify-center px-4">
			<p className={cn('max-w-md text-center text-sm', notice.className)}>{notice.text}</p>
		</div>
	);
}
