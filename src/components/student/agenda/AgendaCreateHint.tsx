import { LuInfo } from 'react-icons/lu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const createAppointmentHint = 'Houd Ctrl ingedrukt om een nieuwe melding te maken.';

export default function AgendaCreateHint() {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span
					role="img"
					className="inline-flex cursor-help text-current opacity-80"
					aria-label={createAppointmentHint}
				>
					<LuInfo className="size-3.5" />
				</span>
			</TooltipTrigger>
			<TooltipContent>{createAppointmentHint}</TooltipContent>
		</Tooltip>
	);
}
