import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AbsencesProvider } from '@/context/AbsencesProvider';
import { StudentsProvider } from '@/context/StudentsProvider';

// biome-ignore lint/style/noNonNullAssertion: root always exists
ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<TooltipProvider delayDuration={200}>
			<StudentsProvider>
				<AbsencesProvider>
					<App />
				</AbsencesProvider>
			</StudentsProvider>
		</TooltipProvider>
	</React.StrictMode>,
);
