import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { TooltipProvider } from '@/components/ui/tooltip';
import { MagisterSessionProvider } from '@/context/MagisterSessionProvider';
import { RegistrationsProvider } from '@/context/RegistrationsProvider';
import { ReturnMeasuresProvider } from '@/context/ReturnMeasuresProvider';
import { StudentsProvider } from '@/context/StudentsProvider';
import { ThemeProvider } from '@/context/ThemeContext';

// biome-ignore lint/style/noNonNullAssertion: root always exists
ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<ThemeProvider>
			<TooltipProvider delayDuration={200}>
				<MagisterSessionProvider>
					<StudentsProvider>
						<RegistrationsProvider>
							<ReturnMeasuresProvider>
								<App />
							</ReturnMeasuresProvider>
						</RegistrationsProvider>
					</StudentsProvider>
				</MagisterSessionProvider>
			</TooltipProvider>
		</ThemeProvider>
	</React.StrictMode>,
);
