import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Search, ExternalLink, Bookmark } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useMasariStore, type LocationPoint } from '../../store/useMasariStore';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to update map center when location changes
function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

interface SearchResult {
    lat: number;
    lon: number;
    display_name: string;
}

export default function MasariMap() {
    const { currentLocation, currentTrip, isTracking, savedLocations } = useMasariStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null);

    const defaultCenter: [number, number] = [24.7136, 46.6753]; // Riyadh
    const center: [number, number] = searchCenter || (currentLocation
        ? [currentLocation.lat, currentLocation.lng]
        : defaultCenter);

    const path = currentTrip ? currentTrip.points.map((p: LocationPoint) => [p.lat, p.lng] as [number, number]) : [];

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`
            );
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectResult = (result: SearchResult) => {
        setSearchCenter([parseFloat(result.lat.toString()), parseFloat(result.lon.toString())]);
        setSearchResults([]);
        setSearchQuery(result.display_name);
    };

    const handleNavigateToResult = (result: SearchResult) => {
        const lat = parseFloat(result.lat.toString());
        const lng = parseFloat(result.lon.toString());
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const url = isMobile
            ? `https://maps.google.com/?q=${lat},${lng}`
            : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        window.open(url, '_blank');
    };

    // Custom icon for saved locations
    const getSavedLocationIcon = (iconType?: string) => {
        const iconEmoji = iconType === 'car' ? '🚗' :
            iconType === 'home' ? '🏠' :
                iconType === 'work' ? '💼' :
                    iconType === 'store' ? '🏪' : '📍';

        return L.divIcon({
            html: `<div style="font-size: 24px;">${iconEmoji}</div>`,
            className: 'custom-div-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
    };

    return (
        <div className="h-full w-full rounded-xl overflow-hidden border border-slate-700 relative">
            {/* Search Bar */}
            <div className="absolute top-4 left-4 right-4 z-[1000]">
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="ابحث عن موقع..."
                        className="w-full bg-slate-800 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 pr-12 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 shadow-lg"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-primary-500 transition-colors"
                    >
                        <Search size={20} />
                    </button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="mt-2 bg-slate-800 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((result, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b last:border-b-0 border-slate-200 dark:border-slate-600"
                            >
                                <button
                                    onClick={() => handleSelectResult(result)}
                                    className="flex-1 text-right"
                                >
                                    <p className="text-sm text-slate-900 dark:text-white">{result.display_name}</p>
                                </button>
                                {/* Save Location Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const { saveLocationFromCoords } = useMasariStore.getState();
                                        saveLocationFromCoords(
                                            parseFloat(result.lat.toString()),
                                            parseFloat(result.lon.toString()),
                                            result.display_name
                                        );
                                        alert('✅ تم حفظ الموقع!');
                                    }}
                                    className="p-2 text-green-500 hover:text-green-600 transition-colors rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                                    title="حفظ الموقع"
                                >
                                    <Bookmark size={18} />
                                </button>
                                {/* Navigate Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleNavigateToResult(result);
                                    }}
                                    className="p-2 text-slate-500 hover:text-primary-500 transition-colors rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                                    title="فتح في الخرائط"
                                >
                                    <ExternalLink size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <MapContainer
                center={center}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                key={searchCenter ? `${searchCenter[0]}-${searchCenter[1]}` : 'default'}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {currentLocation && (
                    <>
                        <Marker position={[currentLocation.lat, currentLocation.lng]}>
                            <Popup>
                                موقعك الحالي <br />
                                السرعة: {currentLocation.speed ? Math.round(currentLocation.speed) : 0} كم/س
                            </Popup>
                        </Marker>
                        {!searchCenter && <MapUpdater center={[currentLocation.lat, currentLocation.lng]} />}
                    </>
                )}

                {isTracking && path.length > 1 && (
                    <Polyline positions={path} color="blue" weight={4} opacity={0.7} />
                )}

                {/* Saved Locations Markers */}
                {savedLocations.map(location => (
                    <Marker
                        key={location.id}
                        position={[location.lat, location.lng]}
                        icon={getSavedLocationIcon(location.icon)}
                    >
                        <Popup>
                            <div className="text-center">
                                <strong className="text-lg">{location.name}</strong>
                                {location.notes && (
                                    <p className="text-sm text-gray-600 mt-1">{location.notes}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                    {new Date(location.savedAt).toLocaleDateString('ar-SA')}
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
