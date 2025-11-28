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
        <div className="h-[calc(100vh-80px)] p-4 pb-24">
            {/* Split Layout: Right (Info) - Left (Map) */}
            <div className="flex flex-col lg:flex-row gap-4 h-full">
                {/* RIGHT COLUMN: Info & Controls (Compact) */}
                <div className="w-full lg:w-1/2 h-full flex flex-col gap-3 pr-1">
                    {/* Controls Section (Fixed at top) */}
                    <div className="flex-shrink-0">
                        <MasariDashboard section="controls" />
                    </div>

                    {/* Tabs for Locations/Trips */}
                    <div className="flex bg-slate-800 p-1 rounded-lg shrink-0 border border-slate-700">
                        <button
                            onClick={() => setActiveTab('locations')}
                            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'locations'
                                ? 'bg-slate-700 text-white shadow'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            المواقع المحفوظة
                        </button>
                        <button
                            onClick={() => setActiveTab('trips')}
                            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'trips'
                                ? 'bg-slate-700 text-white shadow'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            سجل الرحلات
                        </button>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-hidden relative rounded-xl border border-slate-700 bg-slate-800">
                        <div className="absolute inset-0 overflow-y-auto">
                            <MasariDashboard section={activeTab} />
                        </div>
                    </div>
                </div>

                {/* LEFT COLUMN: Map (Fixed) */}
                <div className="w-full lg:w-1/2 h-[400px] lg:h-full rounded-xl overflow-hidden border-2 border-slate-700 relative">
                    <MasariMap />
                </div>
            </div>
        </div>
    );
}
