import { useState } from 'react';
import { Image as ImageIcon, MapPin, Share2, Edit2, Trash2, X, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMasariStore } from '../../store/useMasariStore';
import { shareLocationPhoto } from '../../utils/photoSharing';
import { reverseGeocode } from '../../utils/geocoding';

export default function PhotoStudio() {
    const { savedLocations, deleteSavedLocation } = useMasariStore();
    const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editTitle, setEditTitle] = useState('');

    // Filter only locations with photos
    const photoLocations = savedLocations.filter(loc => loc.photo);

    const handlePhotoClick = (location: any) => {
        setSelectedPhoto(location);
        setEditTitle(location.photoTitle || location.name);
        setIsEditMode(false);
    };

    const handleShare = async () => {
        if (!selectedPhoto) return;

        let address = selectedPhoto.streetAddress;
        if (!address) {
            address = await reverseGeocode(selectedPhoto.lat, selectedPhoto.lng);
        }

        const finalAddress = address || `${selectedPhoto.lat.toFixed(6)}, ${selectedPhoto.lng.toFixed(6)}`;
        await shareLocationPhoto(selectedPhoto.photo, selectedPhoto.photoTitle || selectedPhoto.name, finalAddress);
    };

    const handleNavigate = () => {
        if (!selectedPhoto) return;

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const url = isMobile
            ? `https://maps.google.com/?q=${selectedPhoto.lat},${selectedPhoto.lng}`
            : `https://www.google.com/maps/search/?api=1&query=${selectedPhoto.lat},${selectedPhoto.lng}`;
        window.open(url, '_blank');
    };

    const handleSaveEdit = () => {
        if (!selectedPhoto) return;

        const updatedLocation = {
            ...selectedPhoto,
            photoTitle: editTitle,
            name: editTitle
        };

        // Update in store
        useMasariStore.getState().deleteSavedLocation(selectedPhoto.id);
        useMasariStore.getState().addSavedLocation(updatedLocation);

        setSelectedPhoto(updatedLocation);
        setIsEditMode(false);
    };

    const handleDelete = () => {
        if (!selectedPhoto) return;

        if (confirm(`هل تريد حذف "${selectedPhoto.photoTitle || selectedPhoto.name}"؟`)) {
            deleteSavedLocation(selectedPhoto.id);
            setSelectedPhoto(null);
        }
    };

    if (photoLocations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <ImageIcon size={64} className="text-slate-600 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">لا توجد صور</h3>
                <p className="text-slate-400 text-sm">
                    استخدم زر الكاميرا على الخريطة لالتقاط صور للمواقع
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="text-primary-400" size={24} />
                <h2 className="text-xl font-bold text-white">استوديو الصور</h2>
                <span className="text-sm text-slate-400">({photoLocations.length})</span>
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {photoLocations.map(location => (
                    <motion.div
                        key={location.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePhotoClick(location)}
                        className="relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-slate-700 hover:border-primary-500 transition-all group"
                    >
                        <img
                            src={location.photo}
                            alt={location.photoTitle || location.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-2">
                                <p className="text-white text-xs font-bold truncate">
                                    {location.photoTitle || location.name}
                                </p>
                                <p className="text-slate-300 text-[10px] truncate">
                                    {location.streetAddress || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Photo Viewer Modal */}
            <AnimatePresence>
                {selectedPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="bg-slate-900/50 p-4 flex justify-between items-center border-b border-slate-700">
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="text-primary-500" size={24} />
                                    <h3 className="font-bold text-white">
                                        {isEditMode ? 'تعديل الصورة' : 'عرض الصورة'}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setSelectedPhoto(null)}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-4 overflow-y-auto flex-1 space-y-4">
                                {/* Photo */}
                                <div className="relative rounded-xl overflow-hidden border border-slate-700">
                                    <img
                                        src={selectedPhoto.photo}
                                        alt={selectedPhoto.photoTitle || selectedPhoto.name}
                                        className="w-full h-auto"
                                    />
                                </div>

                                {/* Title */}
                                {isEditMode ? (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            عنوان الصورة
                                        </label>
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            autoFocus
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <h4 className="text-lg font-bold text-white mb-2">
                                            {selectedPhoto.photoTitle || selectedPhoto.name}
                                        </h4>
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <MapPin size={14} />
                                            <span>
                                                {selectedPhoto.streetAddress || `${selectedPhoto.lat.toFixed(6)}, ${selectedPhoto.lng.toFixed(6)}`}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">
                                            {new Date(selectedPhoto.savedAt).toLocaleString('ar-SA')}
                                        </p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-2">
                                    {isEditMode ? (
                                        <>
                                            <button
                                                onClick={() => setIsEditMode(false)}
                                                className="py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                                            >
                                                إلغاء
                                            </button>
                                            <button
                                                onClick={handleSaveEdit}
                                                className="py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                                            >
                                                حفظ
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={handleNavigate}
                                                className="py-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Navigation size={18} />
                                                الذهاب للموقع
                                            </button>
                                            <button
                                                onClick={handleShare}
                                                className="py-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Share2 size={18} />
                                                مشاركة
                                            </button>
                                            <button
                                                onClick={() => setIsEditMode(true)}
                                                className="py-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Edit2 size={18} />
                                                تعديل
                                            </button>
                                            <button
                                                onClick={handleDelete}
                                                className="py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Trash2 size={18} />
                                                حذف
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
