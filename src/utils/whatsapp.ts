import type { SavedLocation } from '../types';
import type { Trip } from '../store/useMasariStore';

/**
 * Share text to WhatsApp
 * @param text - Text to share
 * @param phoneNumber - Optional phone number in international format (e.g., "966501234567")
 */
export const shareToWhatsApp = (text: string, phoneNumber?: string) => {
    const encodedText = encodeURIComponent(text);
    const url = phoneNumber
        ? `https://wa.me/${phoneNumber}?text=${encodedText}`
        : `https://wa.me/?text=${encodedText}`;
    window.open(url, '_blank');
};

/**
 * Share a saved location to WhatsApp
 */
export const shareLocation = (location: SavedLocation, phoneNumber?: string) => {
    const text = `📍 ${location.name}\n\n` +
        `📌 الموقع على الخريطة:\n` +
        `https://maps.google.com/?q=${location.lat},${location.lng}\n\n` +
        (location.notes ? `📝 ملاحظات: ${location.notes}\n\n` : '') +
        (location.category ? `🏷️ الفئة: ${location.category}\n` : '');

    shareToWhatsApp(text, phoneNumber);
};

/**
 * Share a trip to WhatsApp
 */
export const shareTrip = (trip: Trip, phoneNumber?: string) => {
    const startDate = new Date(trip.startTime).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const duration = trip.endTime
        ? formatDuration(trip.endTime - trip.startTime)
        : 'جارية';

    const text = `🚗 رحلة\n\n` +
        `📊 المسافة: ${trip.distance.toFixed(2)} كم\n` +
        `📅 التاريخ: ${startDate}\n` +
        `⏱️ المدة: ${duration}\n\n` +
        `📍 عدد النقاط المسجلة: ${trip.points.length}`;

    shareToWhatsApp(text, phoneNumber);
};

/**
 * Share a task/idea to WhatsApp
 */
export const shareTask = (task: { title: string; description?: string; dueDate?: number }, phoneNumber?: string) => {
    const dueDateText = task.dueDate
        ? `\n📅 الموعد: ${new Date(task.dueDate).toLocaleDateString('ar-SA')}`
        : '';

    const text = `✅ مهمة: ${task.title}\n\n` +
        (task.description ? `📝 ${task.description}\n` : '') +
        dueDateText;

    shareToWhatsApp(text, phoneNumber);
};

/**
 * Share financial summary to WhatsApp
 */
export const shareFinancialSummary = (summary: {
    totalIncome: number;
    totalExpenses: number;
    currentBalance: number;
}, phoneNumber?: string) => {
    const text = `💰 ملخص مالي\n\n` +
        `💵 إجمالي الدخل: ${summary.totalIncome.toFixed(2)} ريال\n` +
        `💸 إجمالي المصروفات: ${summary.totalExpenses.toFixed(2)} ريال\n` +
        `💳 الرصيد الحالي: ${summary.currentBalance.toFixed(2)} ريال`;

    shareToWhatsApp(text, phoneNumber);
};

/**
 * Download backup file (for sharing manually via WhatsApp)
 */
export const downloadBackup = (backupData: any) => {
    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `minasati_backup_${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);

    // Inform user
    alert('تم تنزيل النسخة الاحتياطية. يمكنك الآن مشاركتها عبر WhatsApp.');
};

/**
 * Helper: Format duration in Arabic
 */
function formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} يوم`;
    if (hours > 0) return `${hours} ساعة`;
    return `${minutes} دقيقة`;
}
