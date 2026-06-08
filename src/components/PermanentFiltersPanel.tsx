import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { PermanentFilterOption } from './SearchAndFiltersBar';

interface PermanentFiltersPanelProps {
	show: boolean;
	title: string;
	options: PermanentFilterOption[];
	selected: Set<string>;
	onChange: (value: string, checked: boolean) => void;
}

export function PermanentFiltersPanel({ show, title, options, selected, onChange }: PermanentFiltersPanelProps) {
	return (
		<div
			className={cn(
				'overflow-hidden transition-all duration-300 ease-in-out',
				show ? 'max-h-screen opacity-100 mb-2' : 'max-h-0 opacity-0 mb-0',
			)}
		>
			<div className="p-4 border rounded-md bg-card shadow-sm">
				<h3 className="text-sm font-medium text-foreground mb-2">{title}</h3>
				<div className="grid grid-cols-4 gap-2">
					{options.map((opt) => (
						<div key={opt.value} className="flex items-center space-x-2">
							<Checkbox
								id={`perm-${opt.value}`}
								checked={selected.has(opt.value)}
								onCheckedChange={(checked) => onChange(opt.value, checked === true)}
							/>
							<label
								htmlFor={`perm-${opt.value}`}
								className="text-sm font-medium leading-none cursor-pointer"
							>
								{opt.label}
							</label>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
