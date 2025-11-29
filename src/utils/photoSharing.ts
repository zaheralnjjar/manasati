// Photo Sharing Utility for Masari
// Handles sharing location photos with titles and addresses

/**
 * Share a location photo with title and address
 * @param photoData Base64 encoded photo data
 * @param title Photo title
 * @param address Street address or coordinates
 * @returns Promise<boolean> Success status
 */
export async function shareLocationPhoto(
    photoData: string,
    title: string,
    address: string
): Promise<boolean> {
    try {
        // Check if Web Share API is supported
        if (!navigator.share) {
            console.warn('Web Share API not supported');
            // Fallback: copy to clipboard or download
            await fallbackShare(photoData, title, address);
            return true;
        }

        // Convert base64 to blob
        const blob = await fetch(photoData).then(r => r.blob());
        const file = new File([blob], 'location-photo.jpg', { type: 'image/jpeg' });

        // Prepare share data
        const shareData: ShareData = {
            files: [file],
            title: title || 'موقعي',
            text: `${title}\n📍 ${address}`
        };

        // Check if files can be shared
        if (navigator.canShare && !navigator.canShare(shareData)) {
            console.warn('Cannot share files, using text only');
            await navigator.share({
                title: title || 'موقعي',
                text: `${title}\n📍 ${address}`
            });
            return true;
        }

        // Share
        await navigator.share(shareData);
        return true;

    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            // User cancelled share
            return false;
        }
        console.error('Error sharing photo:', error);
        return false;
    }
}

/**
 * Fallback sharing method when Web Share API is not available
 */
async function fallbackShare(photoData: string, title: string, address: string): Promise<void> {
    // Create a temporary link to download the image
    const link = document.createElement('a');
    link.href = photoData;
    link.download = `${title || 'location'}.jpg`;

    // Copy text to clipboard
    const text = `${title}\n📍 ${address}`;
    try {
        await navigator.clipboard.writeText(text);
        alert(`تم نسخ العنوان إلى الحافظة:\n${text}\n\nسيتم تنزيل الصورة...`);
    } catch (e) {
        alert(`العنوان: ${text}\n\nسيتم تنزيل الصورة...`);
    }

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Check if sharing is supported
 */
export function isSharingSupported(): boolean {
    return 'share' in navigator;
}
