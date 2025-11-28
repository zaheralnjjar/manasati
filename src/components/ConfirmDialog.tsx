import { X } from 'lucide-react';

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDangerous?: boolean;
}

export default function ConfirmDialog({
    title,
    message,
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    onConfirm,
    onCancel,
    isDangerous = false,
}: ConfirmDialogProps) {
    return (
        <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[99999]"
            onClick={(e) => {
                // Close on backdrop click
                if (e.target === e.currentTarget) {
                    onCancel();
                }
            }}
        >
            <div
                className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Message */}
                <p className="text-slate-300 mb-6 leading-relaxed">{message}</p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-4 py-3 font-medium transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 rounded-lg px-4 py-3 font-medium transition-colors ${isDangerous
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-primary-500 hover:bg-primary-600 text-white'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
