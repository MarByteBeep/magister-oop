'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import {
	authorizedLabel,
	OptionalTooltipLine,
	TimeRangeTooltipLine,
} from '@/components/registrations/registrationTooltipLines';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { registrationAbbreviation, registrationLessonHourLabel } from '@/lib/registrations/entries';
import { parseOptionalDate } from '@/lib/shared/dateUtils';
import { cn } from '@/lib/utils';
import type { AgendaRegistration, RegistrationTone } from '@/magister/response/agendaEntry.types';

function isActivationKey(key: string): boolean {
	if (key === 'Enter') return true;
	return key === ' ';
}

const toneClasses: Record<RegistrationTone, string> = {
	absence: 'bg-red-500 text-white',
	late: 'bg-orange-500 text-white',
	other: 'bg-yellow-400 text-yellow-950',
};

const registrationIconStyles = cva(
	'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full font-mono font-semibold leading-none',
	{
		variants: {
			size: {
				sm: 'h-4 min-w-4 px-0.5 text-[9px]',
				md: 'h-5 min-w-5 px-0.5 text-[11px]',
				lg: 'h-6 min-w-6 px-1 text-xs',
			},
		},
		defaultVariants: {
			size: 'sm',
		},
	},
);

export interface RegistrationIconProps extends VariantProps<typeof registrationIconStyles> {
	registration: AgendaRegistration;
	start?: string;
	end?: string;
	className?: string;
	onSelect?: () => void;
}

function trimmedRegistrationComment(comment: string | null | undefined): string {
	if (comment === undefined) return '';
	if (comment === null) return '';
	return comment.trim();
}

function RegistrationTooltip({
	registration,
	start,
	end,
}: {
	registration: AgendaRegistration;
	start?: string;
	end?: string;
}) {
	const begin = parseOptionalDate(start);
	const finish = parseOptionalDate(end);
	const hour = registrationLessonHourLabel(registration);
	const comment = trimmedRegistrationComment(registration.comment);
	const lesson = registration.appointmentDescription.trim();

	return (
		<div className="space-y-1">
			<div className="font-bold">{registration.description}</div>
			<OptionalTooltipLine
				show={registration.code.trim() !== ''}
			>{`Afkorting: ${registration.code}`}</OptionalTooltipLine>
			<TimeRangeTooltipLine begin={begin} finish={finish} />
			<OptionalTooltipLine show={Boolean(hour)}>{`Lesuur: ${hour}`}</OptionalTooltipLine>
			<OptionalTooltipLine show={lesson !== ''}>{`Les: ${lesson}`}</OptionalTooltipLine>
			<div>Geoorloofd: {authorizedLabel(registration.isAuthorized)}</div>
			<OptionalTooltipLine show={comment !== ''}>{`Opmerking: ${comment}`}</OptionalTooltipLine>
		</div>
	);
}

function handleRegistrationKeyDown(
	event: { key: string; preventDefault: () => void; stopPropagation: () => void },
	onSelect: (() => void) | undefined,
) {
	if (!isActivationKey(event.key)) return;
	event.preventDefault();
	event.stopPropagation();
	invokeSelect(onSelect);
}

function invokeSelect(onSelect: (() => void) | undefined) {
	if (!onSelect) return;
	onSelect();
}

/** Round registration mark: reason abbreviation, with the registration details on hover. */
export default function RegistrationIcon({
	registration,
	start,
	end,
	size,
	className,
	onSelect,
}: RegistrationIconProps) {
	const abbreviation = registrationAbbreviation(registration.code, registration.description);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span
					role="img"
					className={cn(registrationIconStyles({ size }), toneClasses[registration.tone], className)}
					aria-label={registration.description}
					onPointerDown={(event) => event.stopPropagation()}
					onClick={(event) => {
						event.stopPropagation();
						invokeSelect(onSelect);
					}}
					onKeyDown={(event) => handleRegistrationKeyDown(event, onSelect)}
				>
					{abbreviation}
				</span>
			</TooltipTrigger>
			<TooltipContent>
				<RegistrationTooltip registration={registration} start={start} end={end} />
			</TooltipContent>
		</Tooltip>
	);
}
