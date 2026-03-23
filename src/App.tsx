import { Toaster } from 'sonner';
import Absences from '@/components/Absences';
import Occupancy from '@/components/occupancy/Occupancy';
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
					<TabsList className="bg-background sticky top-0 z-10 border-b gap-1 border p-1 w-full shrink-0">
						<TabsTrigger value="leerlingen">Leerlingen</TabsTrigger>
						<TabsTrigger value="medewerkers">Medewerkers</TabsTrigger>
						<TabsTrigger value="bezetting">Bezetting</TabsTrigger>
						<TabsTrigger value="absenties">
							Absenties
							{absentCount > 0 && (
								<Badge variant="destructive" className="ml-1.5 h-5 min-w-5 px-1.5 text-xs">
									{absentCount}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value="terugkomers">Terugkomers</TabsTrigger>
					</TabsList>

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
