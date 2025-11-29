import { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PhotoCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (photoData: string, title: string) => void;
    currentLocation: { lat: number; lng: number } | null;
}

export default function PhotoCaptureModal({ isOpen, onClose, onCapture, currentLocation }: PhotoCaptureModalProps) {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [photoTitle, setPhotoTitle] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Start camera when modal opens
    useEffect(() => {
        if (isOpen && !capturedPhoto) {
            startCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isOpen]);

    const startCamera = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Back camera on mobile
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            setError('لا يمكن الوصول إلى الكاميرا. يرجى التحقق من الأذونات.');
        } finally {
            setIsLoading(false);
        }
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

    const retakePhoto = () => {
        setCapturedPhoto(null);
        setPhotoTitle('');
        startCamera();
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
                            <Camera className="text-primary-500" size={24} />
                            <h3 className="font-bold text-white">
                                {capturedPhoto ? 'معاينة الصورة' : 'التقاط صورة'}
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
                        {error ? (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                                <p className="text-red-400 text-sm">{error}</p>
                                <button
                                    onClick={startCamera}
                                    className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                                >
                                    إعادة المحاولة
                                </button>
                            </div>
                        ) : capturedPhoto ? (
                            /* Photo Preview */
                            <div className="space-y-4">
                                <div className="relative rounded-xl overflow-hidden border border-slate-700">
                                    <img
                                        src={capturedPhoto}
                                        alt="Captured"
                                        className="w-full h-auto"
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

                                {/* Location Info */}
                                {currentLocation && (
                                    <div className="bg-slate-700/50 rounded-lg p-3 text-sm text-slate-300">
                                        <p className="flex items-center gap-2">
                                            <span className="text-primary-400">📍</span>
                                            الموقع: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                                        </p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={retakePhoto}
                                        className="flex-1 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <RotateCcw size={18} />
                                        إعادة التقاط
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
                            /* Camera View */
                            <div className="space-y-4">
                                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black aspect-video">
                                    {isLoading ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-white text-sm">جاري تشغيل الكاميرا...</div>
                                        </div>
                                    ) : (
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>

                                {/* Capture Button */}
                                {!isLoading && stream && (
                                    <button
                                        onClick={capturePhoto}
                                        className="w-full py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 text-lg font-bold"
                                    >
                                        <Camera size={24} />
                                        التقاط الصورة
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Hidden canvas for photo capture */}
                    <canvas ref={canvasRef} className="hidden" />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
