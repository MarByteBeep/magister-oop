import type React from 'react';
import { LuLoaderCircle } from 'react-icons/lu';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
	className?: string;
	iconClassName?: string; // Added for specific icon styling
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className, iconClassName }) => {
	return (
		<div className={cn('flex items-center justify-center', className)}>
			<LuLoaderCircle className={cn('h-6 w-6 animate-spin text-primary', iconClassName)} />
		</div>
	);
};

export default LoadingSpinner;
