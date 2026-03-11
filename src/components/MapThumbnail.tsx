import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton'; // Shadcn Skeleton component

interface MapThumbnailProps {
	address: string;
	width?: number; // standaard 300
	height?: number; // standaard 200
	zoom?: number; // standaard 15
	defaultImage?: string; // fallback als adres niet gevonden
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export function MapThumbnail({
	address,
	width = 300,
	height = 200,
	zoom = 15,
	defaultImage = '/default-map.png',
}: MapThumbnailProps) {
	const [coords, setCoords] = useState<{ lat: string; lon: string } | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchCoords() {
			try {
				await sleep(1000); // Adhere to rate limit of 1 request per second
				const res = await fetch(
					`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
				);
				const data = await res.json();
				if (data.length > 0) {
					setCoords({ lat: data[0].lat, lon: data[0].lon });
				} else {
					setCoords(null);
				}
			} catch (err) {
				console.error('Fout bij ophalen coördinaten:', err);
				setCoords(null);
			} finally {
				setLoading(false);
			}
		}
		fetchCoords();
	}, [address]);

	if (loading) {
		return <Skeleton className="w-[300px] h-[200px] rounded-xl" />;
	}

	const mapUrl =
		coords !== null
			? `https://maps.wikimedia.org/img/osm-intl,${zoom},${coords.lat},${coords.lon},${width}x${height}.png`
			: defaultImage;

	const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

	return (
		<a
			href={coords ? googleMapsUrl : '#'}
			target={coords ? '_blank' : undefined}
			rel={coords ? 'noopener noreferrer' : undefined}
		>
			<img
				src={mapUrl}
				alt={coords ? `Kaart van ${address}` : 'Adres niet gevonden'}
				className="rounded-xl shadow-md"
				width={width}
				height={height}
			/>
		</a>
	);
}
