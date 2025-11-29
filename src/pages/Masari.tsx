
import { useEffect } from 'react';
import MasariMap from '../components/masari/MasariMap';
import MasariDashboard from '../components/masari/MasariDashboard';
import { useMasariStore } from '../store/useMasariStore';

export default function Masari() {
    const { updateLocation } = useMasariStore();

    // Auto-detect location once when page loads (not tracking)
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    updateLocation({
                        id: crypto.randomUUID(),
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        timestamp: Date.now()
                    });
                },
                (error) => {
                    console.error('Error getting location:', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        }
    }, []); // Run once on mount

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col lg:flex-row overflow-hidden bg-slate-900">
            {/* Map Section: 45% height on mobile, 70% width on desktop */}
            <div className="w-full h-[45%] lg:h-full lg:w-[70%] relative z-0 border-b lg:border-b-0 lg:border-l border-slate-700 shadow-xl order-1 lg:order-1">
                <MasariMap />
            </div>

            {/* Dashboard Section: 55% height on mobile, 30% width on desktop */}
            <div className="w-full h-[55%] lg:h-full lg:w-[30%] relative z-10 bg-slate-900 order-2 lg:order-2">
                <div className="h-full w-full p-0">
                    <MasariDashboard />
                </div>
            </div>
        </div>
    );
}
