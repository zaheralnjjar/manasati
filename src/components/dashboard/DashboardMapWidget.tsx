import { MapPin, Navigation } from 'lucide-react';
import MasariMap from '../masari/MasariMap';
import { useMasariStore } from '../../store/useMasariStore';

export default function DashboardMapWidget() {
    const { currentLocation, updateLocation, savedLocations } = useMasariStore();

    // Find all saved parking locations
    const parkingLocations = savedLocations.filter(loc => loc.category === 'parking');

    const handleSaveParking = () => {
        if (!currentLocation) {
            return;
        }

        const newParkingLocation = {
            name: `موقفي ${parkingLocations.length + 1} 🚗`,
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            category: 'parking' as const,
            icon: 'car' as const,
            savedAt: Date.now(),
            notes: 'تم الحفظ من الرئيسية'
        };

        useMasariStore.getState().addSavedLocation(newParkingLocation);
    };

    const handleDeleteParking = (id: string) => {
        useMasariStore.getState().deleteSavedLocation(id);
    };

    const handleNavigate = (lat: number, lng: number) => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const url = isMobile
            ? `https://maps.google.com/?q=${lat},${lng}`
            : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank');
    };

    const handleLocateMe = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    updateLocation({
                        id: crypto.randomUUID(),
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        timestamp: Date.now(),
                        speed: position.coords.speed || 0,
                        heading: position.coords.heading || 0
                    });
                },
                (error) => {
                    console.error('Error getting location:', error);
                },
                { enableHighAccuracy: true }
            );
        }
    };

    return (
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700/50 h-full flex flex-col relative overflow-hidden group">
            <div className="flex justify-between items-center mb-3 z-10 relative">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <MapPin className="text-primary-400" size={18} />
                    موقعي
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleLocateMe}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white p-1.5 rounded-lg transition-all"
                        title="تحديث موقعي"
                    >
                        <Navigation size={16} />
                    </button>
                    <button
                        onClick={handleSaveParking}
                        className="bg-primary-500 hover:bg-primary-600 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-lg hover:shadow-primary-500/25"
                    >
                        <MapPin size={14} />
                        حفظ موقفي
                    </button>
                </div>
            </div>

            <div className="flex-1 rounded-xl overflow-hidden border border-slate-700 relative min-h-[350px]">
                <MasariMap />

                {/* Overlay gradient for better text visibility if needed */}
                <div className="absolute inset-0 pointer-events-none border-4 border-slate-800/20 rounded-xl z-[400]"></div>

                {/* Parking Locations Display */}
                {parkingLocations.length > 0 && (
                    <div className="absolute bottom-4 left-4 right-4 z-[1000] flex flex-col gap-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                        {parkingLocations.map(loc => (
                            <div key={loc.id} className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-3 rounded-xl shadow-xl flex items-center justify-between animate-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary-500/20 p-2 rounded-lg text-primary-400">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{loc.name}</h4>
                                        <p className="text-[10px] text-slate-400">
                                            {new Date(loc.savedAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleNavigate(loc.lat, loc.lng)}
                                        className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/20 transition-colors flex items-center gap-1"
                                    >
                                        <Navigation size={12} />
                                        ملاحة
                                    </button>
                                    <button
                                        onClick={() => handleDeleteParking(loc.id)}
                                        className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/20 transition-colors"
                                    >
                                        حذف
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
