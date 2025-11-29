import { useEffect, useState } from 'react';
import MasariMap from '../components/masari/MasariMap';
import MasariDashboard from '../components/masari/MasariDashboard';
import { useMasariStore } from '../store/useMasariStore';

export default function Masari() {
    const { updateLocation } = useMasariStore();
    const [activeTab, setActiveTab] = useState<'locations' | 'trips'>('locations');

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
        <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-slate-900">
            {/* TOP HALF: Map (50%) */}
            <div className="w-full h-[50%] relative z-0 border-b border-slate-700 shadow-xl">
                <MasariMap />
            </div>

            {/* BOTTOM HALF: Dashboard (50%) */}
            <div className="w-full h-[50%] relative z-10 bg-slate-900">
                <div className="h-full w-full p-1">
                    <MasariDashboard />
                </div>
            </div>
        </div>
    );
}
