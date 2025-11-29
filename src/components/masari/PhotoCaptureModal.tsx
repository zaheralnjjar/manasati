import { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { reverseGeocode } from '../../utils/geocoding';

interface PhotoCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (photoData: string, title: string) => void;
    currentLocation: { lat: number; lng: number } | null;
    onRequestLocation?: () => void;
}

export default function PhotoCaptureModal({ isOpen, onClose, onCapture, currentLocation, onRequestLocation }: PhotoCaptureModalProps) {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [photoTitle, setPhotoTitle] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [address, setAddress] = useState<string>('');

    // Request fresh location when modal opens
    useEffect(() => {
        if (isOpen && onRequestLocation) {
            onRequestLocation();
        }
    }, [isOpen, onRequestLocation]);

    // Fetch address when location is available
    useEffect(() => {
        const fetchAddress = async () => {
            if (currentLocation) {
                try {
                    const addr = await reverseGeocode(currentLocation.lat, currentLocation.lng);
                    setAddress(addr || `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`);
                } catch (e) {
                    setAddress(`${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`);
                }
            }
        };
        fetchAddress();
    }, [currentLocation]);

    // ... existing code ...

    {/* Location Info */ }
    {
        currentLocation && (
            <div className="bg-slate-700/50 rounded-lg p-3 text-sm text-slate-300">
                <p className="flex items-center gap-2">
                    <span className="text-primary-400">📍</span>
                    الموقع: {address || 'جاري تحديد العنوان...'}
                </p>
            </div>
        )
    }

    const startCamera = async () => {
        setIsLoading(true);
        setError(null);

        // Check if browser supports mediaDevices
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            const isSecure = window.isSecureContext;
            let msg = 'المتصفح لا يدعم الوصول للكاميرا.';
            if (!isSecure) {
                msg = 'عذراً، الكاميرا تتطلب اتصالاً آمناً (HTTPS). لا يمكن تشغيل الكاميرا على عنوان IP محلي (HTTP). يرجى استخدام localhost أو إعداد HTTPS.';
            }
            setError(msg);
            setIsLoading(false);
            return;
        }

        try {
            console.log('Starting camera...');
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode },
                audio: false
            });

            console.log('Stream obtained:', mediaStream.id);
            setStream(mediaStream);
            // Stream attachment is now handled by useEffect
        } catch (err: any) {
            console.error('Camera Error:', err);
            setError(err.message || 'خطأ في تشغيل الكاميرا');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleCamera = () => {
        stopCamera();
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(photoData);

        // Stop camera after capture
        stopCamera();
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedPhoto(reader.result as string);
                // Stop camera if it was running
                stopCamera();
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const retakePhoto = () => {
        setCapturedPhoto(null);
        setPhotoTitle('');
        // Don't auto start camera, let user choose again
    };

    const handleSave = () => {
        if (capturedPhoto) {
            onCapture(capturedPhoto, photoTitle || 'صورة موقع');
            handleClose();
        }
    };

    const handleClose = () => {
        stopCamera();
        setCapturedPhoto(null);
        setPhotoTitle('');
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="bg-slate-900/50 p-4 flex justify-between items-center border-b border-slate-700">
                        <div className="flex items-center gap-2">
                            <ImageIcon className="text-primary-500" size={24} />
                            <h3 className="font-bold text-white">
                                {capturedPhoto ? 'معاينة الصورة' : 'إضافة صورة'}
                            </h3>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-4 overflow-y-auto flex-1">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center mb-4">
                                <p className="text-red-400 text-sm">{error}</p>
                                {
                                    // Only show retry button if error is camera related and not just a general error
                                    !capturedPhoto && (
                                        <button
                                            onClick={startCamera}
                                            className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                                        >
                                            إعادة المحاولة
                                        </button>
                                    )
                                }
                            </div>
                        )}

                        {capturedPhoto ? (
                            /* Photo Preview */
                            <div className="space-y-4">
                                <div className="relative rounded-xl overflow-hidden border border-slate-700">
                                    <img
                                        src={capturedPhoto}
                                        alt="Captured"
                                        className="w-full h-auto max-h-[50vh] object-contain bg-black"
                                    />
                                </div>

                                {/* Title Input */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        عنوان الصورة
                                    </label>
                                    <input
                                        type="text"
                                        value={photoTitle}
                                        onChange={(e) => setPhotoTitle(e.target.value)}
                                        placeholder="أدخل عنواناً للصورة..."
                                        className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        autoFocus
                                    />
                                </div>

                                {/* Location Info - Editable */}
                                {currentLocation && (
                                    <div className="bg-slate-700/50 rounded-lg p-3 text-sm text-slate-300">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-primary-400">📍</span>
                                            <span className="font-medium">الموقع:</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="أدخل اسم الموقع..."
                                            className="w-full bg-slate-800 text-white rounded px-2 py-1 text-sm border border-slate-600 focus:border-primary-500 focus:outline-none"
                                        />
                                        <div className="text-[10px] text-slate-500 mt-1 text-left dir-ltr">
                                            {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={retakePhoto}
                                        className="flex-1 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <RotateCcw size={18} />
                                        تغيير الصورة
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="flex-1 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Check size={18} />
                                        حفظ
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Selection Mode - File Upload Only */
                            <div className="space-y-4">
                                {/* Upload from Gallery Button - Primary Option */}
                                <button
                                    onClick={triggerFileUpload}
                                    className="w-full py-12 bg-gradient-to-br from-primary-500/20 to-primary-600/10 border-2 border-dashed border-primary-500/50 rounded-xl hover:border-primary-500 hover:from-primary-500/30 hover:to-primary-600/20 transition-all group flex flex-col items-center justify-center gap-4"
                                >
                                    <div className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <ImageIcon className="text-primary-400" size={40} />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-xl font-bold text-white mb-2">اختيار صورة</h4>
                                        <p className="text-sm text-slate-400">اضغط لاختيار صورة من جهازك</p>
                                    </div>
                                </button>

                                {/* Info Note */}
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                                    <p className="text-blue-400 text-xs">
                                        💡 يمكنك اختيار صورة موجودة أو التقاط صورة جديدة من تطبيق الكاميرا
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Hidden inputs */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
