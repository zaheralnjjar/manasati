import { MapPin, Navigation, Camera, Share2 } from 'lucide-react';
import { useState } from 'react';
import MasariMap from '../masari/MasariMap';
import PhotoCaptureModal from '../masari/PhotoCaptureModal';
import { useMasariStore } from '../../store/useMasariStore';
import { reverseGeocode } from '../../utils/geocoding';
import { shareLocationPhoto } from '../../utils/photoSharing';

export default function DashboardMapWidget() {
    const { currentLocation, updateLocation, savedLocations } = useMasariStore();
    const [isPhotoCaptureOpen, setIsPhotoCaptureOpen] = useState(false);

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

    const handlePhotoCapture = async (photoData: string, title: string) => {
        if (!currentLocation) return;

        // Get street address via reverse geocoding
        const streetAddress = await reverseGeocode(currentLocation.lat, currentLocation.lng);

        // Use street address as name if available, otherwise use title or default
        const locationName = streetAddress || title || 'صورة موقع';

        const newPhotoLocation = {
            name: locationName,
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            category: 'photo' as const,
            icon: 'pin' as const,
            photo: photoData,
            photoTitle: title,
            streetAddress: streetAddress || undefined,
            savedAt: Date.now(),
            notes: 'تم التقاط الصورة من الرئيسية'
        };

        useMasariStore.getState().addSavedLocation(newPhotoLocation);
    };

    const handleShare = async (location: any) => {
        // Get or create street address
        let address = location.streetAddress;
        if (!address) {
            address = await reverseGeocode(location.lat, location.lng);
        }

        const finalAddress = address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;

        if (location.photo) {
            // Share with photo
            await shareLocationPhoto(location.photo, location.photoTitle || location.name, finalAddress);
        } else {
            // Share text only
            const text = `${location.name}\n📍 ${finalAddress}`;
            if (navigator.share) {
                try {
                    await navigator.share({ title: location.name, text });
                } catch (e) {
                    if ((e as Error).name !== 'AbortError') {
                        navigator.clipboard.writeText(text);
                        alert('تم نسخ الموقع إلى الحافظة');
                    }
                }
            } else {
                navigator.clipboard.writeText(text);
                alert('تم نسخ الموقع إلى الحافظة');
            }
        }
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
                        id: Date.now().toString() + Math.random().toString(36).substring(2),
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
        <div className="bg-slate-800 rounded-2xl p-2 md:p-4 border border-slate-700/50 h-full flex flex-col relative overflow-hidden group">
            <div className="flex justify-between items-center mb-2 z-10 relative">
                <h2 className="text-sm md:text-lg font-bold text-white flex items-center gap-2">
                    <MapPin className="text-primary-400" size={16} />
                    موقعي
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsPhotoCaptureOpen(true)}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white p-1.5 rounded-lg transition-all"
                        title="التقاط صورة"
                    >
                        <Camera size={14} />
                    </button>
                    <button
                        onClick={handleLocateMe}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white p-1.5 rounded-lg transition-all"
                        title="تحديث موقعي"
                    >
                        <Navigation size={14} />
                    </button>
                    <button
                        onClick={handleSaveParking}
                        className="bg-primary-500 hover:bg-primary-600 text-white text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 transition-all shadow-lg hover:shadow-primary-500/25"
                    >
                        <MapPin size={12} />
                        حفظ موقفي
                    </button>
                </div>
            </div>

            <div className="h-[350px] md:h-[450px] rounded-xl overflow-hidden border border-slate-700 relative">
                <MasariMap />

                {/* Overlay gradient for better text visibility if needed */}
                <div className="absolute inset-0 pointer-events-none border-4 border-slate-800/20 rounded-xl z-[400]"></div>

                {/* Parking Locations Display */}
                {parkingLocations.length > 0 && (
                    <div className="absolute bottom-2 left-2 right-2 z-[1000] flex flex-col gap-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                        {parkingLocations.map(loc => (
                            <div key={loc.id} className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-2 rounded-xl shadow-xl flex items-center justify-between animate-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2">
                                    <div className="bg-primary-500/20 p-1.5 rounded-lg text-primary-400">
                                        <MapPin size={16} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-xs">{loc.name}</h4>
                                        <p className="text-[9px] text-slate-400">
                                            {(() => {
                                                try {
                                                    const date = new Date(loc.savedAt);
                                                    return isNaN(date.getTime()) ? '' : date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
                                                } catch (e) {
                                                    return '';
                                                }
                                            })()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleShare(loc)}
                                        className="text-[10px] bg-green-500/10 hover:bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20 transition-colors flex items-center gap-1"
                                        title="مشاركة"
                                    >
                                        <Share2 size={10} />
                                    </button>
                                    <button
                                        onClick={() => handleNavigate(loc.lat, loc.lng)}
                                        className="text-[10px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 transition-colors flex items-center gap-1"
                                    >
                                        <Navigation size={10} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteParking(loc.id)}
                                        className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 transition-colors"
                                    >
                                        حذف
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Photo Capture Modal */}
            <PhotoCaptureModal
                isOpen={isPhotoCaptureOpen}
                onClose={() => setIsPhotoCaptureOpen(false)}
                onCapture={handlePhotoCapture}
                currentLocation={currentLocation}
                onRequestLocation={() => {
                    // Update location when modal opens
                    if ('geolocation' in navigator) {
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                updateLocation({
                                    id: Date.now().toString() + Math.random().toString(36).substring(2),
                                    lat: position.coords.latitude,
                                    lng: position.coords.longitude,
                                    timestamp: Date.now(),
                                    speed: position.coords.speed || 0,
                                    heading: position.coords.heading || 0
                                });
                            },
                            (error) => console.error('Error getting location:', error),
                            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                        );
                    }
                }}
            />
        </div>
    );
}
