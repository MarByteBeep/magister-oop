import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AbsencesProvider } from '@/context/AbsencesProvider';
import { StudentsProvider } from '@/context/StudentsProvider';
import { ThemeProvider } from '@/context/ThemeContext';

// biome-ignore lint/style/noNonNullAssertion: root always exists
ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<ThemeProvider>
			<TooltipProvider delayDuration={200}>
				<StudentsProvider>
					<AbsencesProvider>
						<App />
					</AbsencesProvider>
				</StudentsProvider>
			</TooltipProvider>
		</ThemeProvider>
	</React.StrictMode>,
);
