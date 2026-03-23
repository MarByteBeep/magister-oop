'use client';

import { LuLaptop, LuMoon, LuSettings, LuSun } from 'react-icons/lu';
import { useTheme } from '@/context/ThemeContext';
import { appPackage } from '@/lib/appPackage';
import { isThemePreference } from '@/lib/themePreference';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

/** Solid primary fill: `primary/20` is nearly invisible in dark mode (primary is ~white). */
const themeToggleItemClass =
	'min-w-24 transition-none data-[state=on]:border-transparent data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm';

function Settings() {
	const { theme, setTheme } = useTheme();

	const handleThemeChange = (nextTheme: string) => {
		if (!isThemePreference(nextTheme)) return;
		setTheme(nextTheme);
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" size="icon" aria-label="Instellingen openen">
					<LuSettings className="h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="text-xl">Instellingen</DialogTitle>
				</DialogHeader>

				<section className="space-y-2">
					<p className="text-sm font-medium text-foreground">Thema</p>
					<ToggleGroup
						type="single"
						value={theme}
						onValueChange={handleThemeChange}
						className="w-full justify-start"
					>
						<ToggleGroupItem value="light" aria-label="Licht thema" className={themeToggleItemClass}>
							<LuSun className="h-4 w-4" />
							Licht
						</ToggleGroupItem>
						<ToggleGroupItem value="dark" aria-label="Donker thema" className={themeToggleItemClass}>
							<LuMoon className="h-4 w-4" />
							Donker
						</ToggleGroupItem>
						<ToggleGroupItem value="system" aria-label="Systeem thema" className={themeToggleItemClass}>
							<LuLaptop className="h-4 w-4" />
							Systeem
						</ToggleGroupItem>
					</ToggleGroup>
				</section>

				<section className="space-y-2">
					<p className="text-sm font-medium text-foreground">App informatie</p>
					<div className="space-y-1 text-sm text-muted-foreground">
						<p>Versie: {appPackage.version}</p>
						<p>Auteur: {appPackage.author}</p>
						<p>
							{appPackage.copyright} (
							<a
								href={appPackage.licenseUrl}
								target="_blank"
								rel="noreferrer"
								className="underline hover:opacity-80"
							>
								{appPackage.license}
							</a>
							)
						</p>
						<p>
							<a
								href={appPackage.issuesUrl}
								target="_blank"
								rel="noreferrer"
								className="underline hover:opacity-80"
							>
								Report an issue
							</a>
						</p>
					</div>
				</section>
			</DialogContent>
		</Dialog>
	);
}

export default Settings;
