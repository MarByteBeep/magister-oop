import { MagisterSessionNotice } from '@/components/MagisterSessionNotice';
import Occupancy from '@/components/occupancy/Occupancy';
import Registrations from '@/components/Registrations';
import ReturnMeasures from '@/components/ReturnMeasures';
import Settings from '@/components/Settings';
import Students from '@/components/Students';
import { ThemedToaster } from '@/components/ThemedToaster';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMagisterSession } from '@/context/MagisterSessionContext';
import { useRegistrationsContext } from '@/context/RegistrationsContext';
import { useReturnMeasuresContext } from '@/context/ReturnMeasuresContext';
import { useActionBadge } from '@/hooks/shared/useActionBadge';
import type { MagisterSessionStatus } from '@/lib/session/magisterSession';

function TabCountBadge({ count }: { count: number }) {
	if (count <= 0) return null;
	return (
		<Badge variant="destructive" className="ml-1.5 h-5 min-w-5 px-1.5 text-xs">
			{count}
		</Badge>
	);
}

function badgeCountWhenReady(ready: boolean, count: number): number {
	if (!ready) return 0;
	return count;
}

function AppTabsBody({ ready, session }: { ready: boolean; session: MagisterSessionStatus }) {
	if (!ready) {
		if (session === 'ready') return null;
		return <MagisterSessionNotice session={session} />;
	}
	return (
		<div className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto pt-2">
			<TabsContent value="students">
				<Students />
			</TabsContent>
			<TabsContent value="staff">
				<p>coming soon...</p>
			</TabsContent>
			<TabsContent value="occupancy">
				<Occupancy />
			</TabsContent>
			<TabsContent value="registrations">
				<Registrations />
			</TabsContent>
			<TabsContent value="return-measures">
				<ReturnMeasures />
			</TabsContent>
		</div>
	);
}

function App() {
	const { registrationCount } = useRegistrationsContext();
	const { openTodayCount } = useReturnMeasuresContext();
	const session = useMagisterSession();
	const ready = session === 'ready';

	useActionBadge(registrationCount);

	return (
		<main className="flex flex-col items-center w-full h-full p-4 min-h-[600px] mx-auto text-center">
			<div className="w-full max-w-[1000px]">
				<Tabs defaultValue="students" className="flex flex-col h-full w-full">
					<div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background">
						<TabsList className="flex h-auto min-h-9 w-full shrink-0 flex-1 min-w-0 gap-2 rounded-none border-0 bg-transparent p-0 shadow-none">
							<TabsTrigger value="students">Leerlingen</TabsTrigger>
							<TabsTrigger value="staff" disabled>
								Medewerkers
							</TabsTrigger>
							<TabsTrigger value="occupancy">Bezetting</TabsTrigger>
							<TabsTrigger value="registrations">
								Registraties
								<TabCountBadge count={badgeCountWhenReady(ready, registrationCount)} />
							</TabsTrigger>
							<TabsTrigger value="return-measures">
								Terugkomers
								<TabCountBadge count={badgeCountWhenReady(ready, openTodayCount)} />
							</TabsTrigger>
						</TabsList>
						<div className="shrink-0">
							<Settings />
						</div>
					</div>

					<AppTabsBody ready={ready} session={session} />
				</Tabs>
			</div>
			<ThemedToaster />
		</main>
	);
}

export default App;
