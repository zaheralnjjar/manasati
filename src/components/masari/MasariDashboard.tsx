import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ChangeEvent } from 'react';
import {
    Play, Square, MapPin, Clock, Navigation, History, Trash2, Share2,
    Bookmark, Edit2, ExternalLink, X, Camera, Target
} from 'lucide-react';
import { useMasariStore } from '../../store/useMasariStore';
import type { LocationPoint, SavedLocation } from '../../store/useMasariStore';

interface MasariDashboardProps {
    section?: 'controls' | 'locations' | 'trips' | 'all';
}

export default function MasariDashboard({ section = 'all' }: MasariDashboardProps) {
    const {
        isTracking,
        currentTrip,
        currentLocation,
        tripHistory,
        savedLocations,
        startTracking,
        stopTracking,
        updateLocation,
        deleteTrip,
        saveCurrentLocation,
        updateSavedLocation,
        deleteSavedLocation,
        settings
    } = useMasariStore();

    const [elapsedTime, setElapsedTime] = useState(0);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [editingLocation, setEditingLocation] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'parking' | 'place' | 'photo'>('all');
    const [locationForm, setLocationForm] = useState<{
        name: string;
        category: 'parking' | 'place' | 'photo';
        icon: 'car' | 'home' | 'work' | 'store' | 'pin';
        notes: string;
        photo?: string;
    }>({
        name: '',
        category: 'parking',
        icon: 'car',
        notes: '',
        photo: undefined
    });

    // Timer for elapsed time
    useEffect(() => {
        let interval: any;
        if (isTracking && currentTrip) {
            interval = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - currentTrip.startTime) / 1000));
            }, 1000);
        } else {
            setElapsedTime(0);
        }
        return () => clearInterval(interval);
    }, [isTracking, currentTrip]);

    // Geolocation Tracking
    useEffect(() => {
        let watchId: number;

        if (isTracking) {
            if ('geolocation' in navigator) {
                watchId = navigator.geolocation.watchPosition(
                    (position) => {
                        const point: LocationPoint = {
                            id: crypto.randomUUID(),
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                            timestamp: position.timestamp,
                            speed: position.coords.speed ? position.coords.speed * 3.6 : 0,
                            heading: position.coords.heading || 0,
                            accuracy: position.coords.accuracy
                        };
                        updateLocation(point);
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                    },
                    {
                        enableHighAccuracy: settings.highAccuracy,
                        maximumAge: 0,
                        timeout: 5000
                    }
                );
            } else {
                alert('خاصية تحديد الموقع غير مدعومة في متصفحك');
            }
        }

        return () => {
            if (watchId !== undefined) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [isTracking, updateLocation, settings.highAccuracy]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString('ar-SA', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleSaveLocation = () => {
        if (!locationForm.name.trim()) {
            alert('يرجى إدخال اسم الموقع');
            return;
        }

        if (editingLocation) {
            updateSavedLocation(editingLocation, {
                name: locationForm.name,
                category: locationForm.category,
                icon: locationForm.icon,
                notes: locationForm.notes,
                photo: locationForm.photo
            });
        } else {
            saveCurrentLocation(
                locationForm.name,
                locationForm.category,
                locationForm.icon,
                locationForm.notes,
                locationForm.photo
            );
        }

        setShowSaveModal(false);
        setEditingLocation(null);
        setLocationForm({
            name: '',
            category: 'parking',
            icon: 'car',
            notes: '',
            photo: undefined
        });
    };

    const handleEditLocation = (id: string) => {
        const location = savedLocations.find(loc => loc.id === id);
        if (location) {
            setLocationForm({
                name: location.name,
                category: location.category,
                icon: location.icon || 'pin',
                notes: location.notes || '',
                photo: location.photo
            });
            setEditingLocation(id);
            setShowSaveModal(true);
        }
    };

    const handleNavigate = (lat: number, lng: number) => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const url = isMobile
            ? `https://maps.google.com/?q=${lat},${lng}`
            : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        window.open(url, '_blank');
    };

    const handleShareLocation = async (location: SavedLocation) => {
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
        const shareData = {
            title: location.name,
            text: `📍 ${location.name}${location.notes ? `\n${location.notes}` : ''}`,
            url: mapUrl
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    await navigator.clipboard.writeText(`${shareData.title}\n${mapUrl}`);
                    alert('تم نسخ الرابط إلى الحافظة');
                }
            }
        } else {
            await navigator.clipboard.writeText(`${shareData.title}\n${mapUrl}`);
            alert('تم نسخ الرابط إلى الحافظة');
        }
    };

    const handlePhotoCapture = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setLocationForm({
                ...locationForm,
                photo: reader.result as string
            });
        };
        reader.readAsDataURL(file);
    };

    const iconOptions = [
        { value: 'car', label: '🚗 سيارة', emoji: '🚗' },
        { value: 'home', label: '🏠 منزل', emoji: '🏠' },
        { value: 'work', label: '💼 عمل', emoji: '💼' },
        { value: 'store', label: '🏪 متجر', emoji: '🏪' },
        { value: 'pin', label: '📍 موقع', emoji: '📍' }
    ];

    // Filter locations based on active tab
    const filteredLocations = activeTab === 'all'
        ? savedLocations
        : savedLocations.filter(loc => loc.category === activeTab);

    // Count locations by category
    const parkingCount = savedLocations.filter(loc => loc.category === 'parking').length;
    const placeCount = savedLocations.filter(loc => loc.category === 'place').length;
    const photoCount = savedLocations.filter(loc => loc.category === 'photo').length;

    return (
        <div className="h-full flex flex-col gap-4 p-4 pb-24">
            {/* Controls */}
            {(section === 'all' || section === 'controls') && (
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-4">
                    <div className="flex gap-2">
                        <button
                            onClick={isTracking ? stopTracking : startTracking}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors ${isTracking
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-primary-500 hover:bg-primary-600 text-white'
                                }`}
                        >
                            {isTracking ? (
                                <>
                                    <Square size={20} fill="white" />
                                    إيقاف التتبع
                                </>
                            ) : (
                                <>
                                    <Play size={20} fill="white" />
                                    بدء التتبع
                                </>
                            )}
                        </button>

                        <button
                            onClick={async () => {
                                if (!currentLocation) return;

                                let locationName = 'موقع محفوظ';
                                try {
                                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLocation.lat}&lon=${currentLocation.lng}&accept-language=ar`);
                                    const data = await response.json();
                                    if (data.address) {
                                        const { road, house_number, suburb, neighbourhood, city, town } = data.address;
                                        const parts = [];
                                        if (road) parts.push(road);
                                        if (house_number) parts.push(house_number);
                                        if (!road && (suburb || neighbourhood)) parts.push(suburb || neighbourhood);
                                        if (parts.length === 0 && (city || town)) parts.push(city || town);

                                        if (parts.length > 0) locationName = parts.join(', ');
                                    }
                                } catch (error) {
                                    console.error('Error fetching address:', error);
                                }

                                // Quick save with auto-generated name
                                const { saveLocationFromCoords } = useMasariStore.getState();
                                saveLocationFromCoords(
                                    currentLocation.lat,
                                    currentLocation.lng,
                                    locationName,
                                    'place'
                                );
                                alert(`✅ تم حفظ الموقع: ${locationName}`);
                            }}
                            onDoubleClick={(e) => {
                                e.preventDefault();
                                setShowSaveModal(true);
                            }}
                            disabled={!currentLocation}
                            className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                            title="ضغطة واحدة: حفظ سريع | ضغطتين: خيارات متقدمة"
                        >
                            <Bookmark size={20} />
                            حفظ
                        </button>

                        <button
                            onClick={() => {
                                if (currentLocation) {
                                    // Center map on current location (will be handled by MasariMap)
                                    window.dispatchEvent(new CustomEvent('centerMapOnCurrentLocation'));
                                }
                            }}
                            disabled={!currentLocation}
                            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-semibold transition-colors"
                            title="تحديد موقعي"
                        >
                            <Target size={20} />
                        </button>
                    </div>

                    {/* Stats */}
                    {isTracking && (
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                                <Clock className="mx-auto mb-1 text-blue-400" size={20} />
                                <div className="text-xs text-slate-400">الوقت</div>
                                <div className="text-white font-bold">{formatTime(elapsedTime)}</div>
                            </div>
                            <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                                <Navigation className="mx-auto mb-1 text-green-400" size={20} />
                                <div className="text-xs text-slate-400">المسافة</div>
                                <div className="text-white font-bold">
                                    {currentTrip?.distance.toFixed(2) || '0.00'} كم
                                </div>
                            </div>
                            <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                                <MapPin className="mx-auto mb-1 text-red-400" size={20} />
                                <div className="text-xs text-slate-400">النقاط</div>
                                <div className="text-white font-bold">{currentTrip?.points.length || 0}</div>
                            </div>
                        </div>
                    )}
                </div>
            )
            }

            {/* Saved Locations */}
            {
                (section === 'all' || section === 'locations') && savedLocations.length > 0 && (
                    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex-shrink-0">
                        <div className="p-4 border-b border-slate-700">
                            <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                                <Bookmark className="text-primary-500" />
                                المواقع المحفوظة
                            </h3>

                            {/* Category Tabs */}
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'all'
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    الكل ({savedLocations.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('parking')}
                                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'parking'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    🚗 مواقف ({parkingCount})
                                </button>
                                <button
                                    onClick={() => setActiveTab('place')}
                                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'place'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    📍 مواقع ({placeCount})
                                </button>
                                <button
                                    onClick={() => setActiveTab('photo')}
                                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'photo'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    📷 صور ({photoCount})
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto p-2 space-y-2">
                            {filteredLocations.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">
                                    لا توجد مواقع محفوظة في هذه الفئة
                                </div>
                            ) : (
                                filteredLocations.map(location => (
                                    <div
                                        key={location.id}
                                        className="bg-slate-700/30 p-3 rounded-lg hover:bg-slate-700/50 transition-colors border border-slate-700/50"
                                    >
                                        {/* Photo preview if exists */}
                                        {location.photo && (
                                            <img
                                                src={location.photo}
                                                alt={location.name}
                                                className="w-full h-32 object-cover rounded-lg mb-3"
                                            />
                                        )}

                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-white flex items-center gap-2">
                                                    <span className="text-xl">
                                                        {location.icon === 'car' ? '🚗' :
                                                            location.icon === 'home' ? '🏠' :
                                                                location.icon === 'work' ? '💼' :
                                                                    location.icon === 'store' ? '🏪' : '📍'}
                                                    </span>
                                                    {location.name}
                                                </div>
                                                {location.notes && (
                                                    <div className="text-xs text-slate-400 mt-1">{location.notes}</div>
                                                )}
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {new Date(location.savedAt).toLocaleString('ar-SA', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleShareLocation(location)}
                                                    className="p-1.5 text-slate-400 hover:text-green-400 hover:bg-slate-600 rounded"
                                                    title="مشاركة"
                                                >
                                                    <Share2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleNavigate(location.lat, location.lng)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-600 rounded"
                                                    title="التنقل"
                                                >
                                                    <ExternalLink size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleEditLocation(location.id)}
                                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600 rounded"
                                                    title="تعديل"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => deleteSavedLocation(location.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded"
                                                    title="حذف"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )
            }

            {/* History */}
            {
                (section === 'all' || section === 'trips') && (
                    <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                            <History className="text-emerald-400" />
                            <h3 className="font-bold text-white">سجل الرحلات</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {tripHistory.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">
                                    لا توجد رحلات مسجلة بعد
                                </div>
                            ) : (
                                tripHistory.map(trip => (
                                    <div key={trip.id} className="bg-slate-700/30 p-3 rounded-lg hover:bg-slate-700/50 transition-colors border border-slate-700/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-sm font-medium text-white">
                                                {formatDate(trip.startTime)}
                                            </div>
                                            <div className="flex gap-1">
                                                <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600 rounded">
                                                    <Share2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => deleteTrip(trip.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 text-xs text-slate-300">
                                            <span className="flex items-center gap-1">
                                                <Navigation size={12} className="text-blue-400" />
                                                {trip.distance.toFixed(2)} كم
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} className="text-orange-400" />
                                                {trip.endTime ? formatTime(Math.floor((trip.endTime - trip.startTime) / 1000)) : '--:--'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )
            }

            {/* Save Location Modal - Floating Window */}
            {
                showSaveModal && createPortal(
                    <div className="fixed top-24 left-0 right-0 z-[9999] flex justify-center pointer-events-none px-4">
                        <div className="bg-slate-800/95 backdrop-blur-md rounded-xl border border-slate-600 shadow-2xl w-full max-w-sm p-4 pointer-events-auto max-h-[80vh] overflow-y-auto transition-all">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white">
                                    {editingLocation ? 'تعديل الموقع' : 'حفظ موقع جديد'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowSaveModal(false);
                                        setEditingLocation(null);
                                        setLocationForm({
                                            name: '',
                                            category: 'parking',
                                            icon: 'car',
                                            notes: '',
                                            photo: undefined
                                        });
                                    }}
                                    className="text-slate-400 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        اسم الموقع
                                    </label>
                                    <input
                                        type="text"
                                        value={locationForm.name}
                                        onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-primary-500"
                                        placeholder="مثال: موقف السيارة"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        نوع الموقع
                                    </label>
                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                        <button
                                            onClick={() => setLocationForm({ ...locationForm, category: 'parking', icon: 'car' })}
                                            className={`p-3 rounded-lg border-2 transition-colors ${locationForm.category === 'parking'
                                                ? 'border-primary-500 bg-primary-500/20'
                                                : 'border-slate-600 hover:border-slate-500'
                                                }`}
                                        >
                                            <div className="text-2xl mb-1">🚗</div>
                                            <div className="text-xs text-slate-300">موقف</div>
                                        </button>
                                        <button
                                            onClick={() => setLocationForm({ ...locationForm, category: 'place', icon: 'pin' })}
                                            className={`p-3 rounded-lg border-2 transition-colors ${locationForm.category === 'place'
                                                ? 'border-primary-500 bg-primary-500/20'
                                                : 'border-slate-600 hover:border-slate-500'
                                                }`}
                                        >
                                            <div className="text-2xl mb-1">📍</div>
                                            <div className="text-xs text-slate-300">موقع</div>
                                        </button>
                                        <button
                                            onClick={() => setLocationForm({ ...locationForm, category: 'photo' })}
                                            className={`p-3 rounded-lg border-2 transition-colors ${locationForm.category === 'photo'
                                                ? 'border-primary-500 bg-primary-500/20'
                                                : 'border-slate-600 hover:border-slate-500'
                                                }`}
                                        >
                                            <div className="text-2xl mb-1">📷</div>
                                            <div className="text-xs text-slate-300">صورة</div>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        الأيقونة
                                    </label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {iconOptions.map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => setLocationForm({ ...locationForm, icon: option.value as any })}
                                                className={`p-3 rounded-lg border-2 transition-colors ${locationForm.icon === option.value
                                                    ? 'border-primary-500 bg-primary-500/20'
                                                    : 'border-slate-600 hover:border-slate-500'
                                                    }`}
                                            >
                                                <span className="text-2xl">{option.emoji}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Photo Capture */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        إضافة صورة (اختياري)
                                    </label>
                                    <label className="w-full bg-slate-700 border-2 border-dashed border-slate-600 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                                        <Camera size={32} className="text-slate-400 mb-2" />
                                        <span className="text-sm text-slate-400">
                                            {locationForm.photo ? 'تغيير الصورة' : 'التقاط صورة'}
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handlePhotoCapture}
                                            className="hidden"
                                        />
                                    </label>
                                    {locationForm.photo && (
                                        <div className="mt-2 relative">
                                            <img
                                                src={locationForm.photo}
                                                alt="Preview"
                                                className="w-full h-32 object-cover rounded-lg"
                                            />
                                            <button
                                                onClick={() => setLocationForm({ ...locationForm, photo: undefined })}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        ملاحظات (اختياري)
                                    </label>
                                    <textarea
                                        value={locationForm.notes}
                                        onChange={(e) => setLocationForm({ ...locationForm, notes: e.target.value })}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 resize-none"
                                        rows={3}
                                        placeholder="أضف ملاحظات..."
                                    />
                                </div>

                                <button
                                    onClick={handleSaveLocation}
                                    className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 rounded-lg font-medium transition-colors"
                                >
                                    {editingLocation ? 'تحديث' : 'حفظ'}
                                </button>
                            </div>
                        </div>
                    </div>
                    , document.body)
            }
        </div >
    );
}
