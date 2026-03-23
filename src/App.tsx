import { Toaster } from 'sonner';
import Absences from '@/components/Absences';
import Occupancy from '@/components/occupancy/Occupancy';
import Settings from '@/components/Settings';
import Students from '@/components/Students';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAbsencesContext } from '@/context/AbsencesContext';

function App() {
	const { absentCount } = useAbsencesContext();

	return (
		<main className="flex flex-col items-center w-full h-full p-4 min-h-[600px] mx-auto text-center">
			{/* Outer wrapper */}
			<div className="w-full max-w-[1000px]">
				<Tabs defaultValue="leerlingen" className="flex flex-col h-full w-full">
					<div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background">
						<TabsList className="flex h-auto min-h-9 w-full shrink-0 flex-1 min-w-0 gap-2 rounded-none border-0 bg-transparent p-0 shadow-none">
							<TabsTrigger value="leerlingen">Leerlingen</TabsTrigger>
							<TabsTrigger value="medewerkers" disabled>
								Medewerkers
							</TabsTrigger>
							<TabsTrigger value="bezetting">Bezetting</TabsTrigger>
							<TabsTrigger value="absenties">
								Absenties
								{absentCount > 0 && (
									<Badge variant="destructive" className="ml-1.5 h-5 min-w-5 px-1.5 text-xs">
										{absentCount}
									</Badge>
								)}
							</TabsTrigger>
							<TabsTrigger value="terugkomers" disabled>
								Terugkomers
							</TabsTrigger>
						</TabsList>
						<div className="shrink-0">
							<Settings />
						</div>
					</div>

					<div className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto pt-2">
						<TabsContent value="leerlingen">
							<Students />
						</TabsContent>
						<TabsContent value="medewerkers">
							<p>coming soon...</p>
						</TabsContent>
						<TabsContent value="bezetting">
							<Occupancy />
						</TabsContent>
						<TabsContent value="absenties">
							<Absences />
						</TabsContent>
						<TabsContent value="terugkomers">
							<p>coming soon...</p>
						</TabsContent>
					</div>
				</Tabs>
			</div>
			<Toaster />
		</main>
	);
}

export default App;
