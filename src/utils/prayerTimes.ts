import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

export interface PrayerTimeResult {
    name: string;
    arabicName: string;
    time: string;
}

export const calculatePrayerTimes = (
    latitude: number,
    longitude: number,
    date: Date = new Date()
): PrayerTimeResult[] => {
    const coordinates = new Coordinates(latitude, longitude);
    const params = CalculationMethod.MuslimWorldLeague();
    const prayerTimes = new PrayerTimes(coordinates, date, params);

    return [
        {
            name: 'Fajr',
            arabicName: 'الفجر',
            time: formatTime(prayerTimes.fajr),
        },
        {
            name: 'Sunrise',
            arabicName: 'الشروق',
            time: formatTime(prayerTimes.sunrise),
        },
        {
            name: 'Dhuhr',
            arabicName: 'الظهر',
            time: formatTime(prayerTimes.dhuhr),
        },
        {
            name: 'Asr',
            arabicName: 'العصر',
            time: formatTime(prayerTimes.asr),
        },
        {
            name: 'Maghrib',
            arabicName: 'المغرب',
            time: formatTime(prayerTimes.maghrib),
        },
        {
            name: 'Isha',
            arabicName: 'العشاء',
            time: formatTime(prayerTimes.isha),
        },
    ];
};

const formatTime = (date: Date): string => {
    try {
        if (!date || isNaN(date.getTime())) return '--:--';
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    } catch (e) {
        return '--:--';
    }
};

export const getNextPrayer = (prayers: PrayerTimeResult[]): PrayerTimeResult | null => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    for (const prayer of prayers) {
        if (prayer.time === '--:--') continue;
        const [hours, minutes] = prayer.time.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) continue;

        const prayerTime = hours * 60 + minutes;

        if (prayerTime > currentTime) {
            return prayer;
        }
    }

    // If no prayer found today, return Fajr (next day)
    return prayers[0];
};

export const getCurrentPrayer = (prayers: PrayerTimeResult[]): PrayerTimeResult | null => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    let currentPrayer: PrayerTimeResult | null = null;

    for (const prayer of prayers) {
        if (prayer.time === '--:--') continue;
        const [hours, minutes] = prayer.time.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) continue;

        const prayerTime = hours * 60 + minutes;

        if (prayerTime <= currentTime) {
            currentPrayer = prayer;
        } else {
            break;
        }
    }

    // If no prayer found (before Fajr), return Isha (from yesterday conceptually)
    if (!currentPrayer) {
        return prayers[prayers.length - 1];
    }
    return currentPrayer;
};

export const getTimeUntilPrayer = (prayerTime: string): string => {
    if (!prayerTime || prayerTime === '--:--') return '--';

    const now = new Date();
    const [hours, minutes] = prayerTime.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes)) return '--';

    const prayer = new Date();
    prayer.setHours(hours, minutes, 0, 0);

    // If prayer time has passed today, set it for tomorrow
    if (prayer < now) {
        prayer.setDate(prayer.getDate() + 1);
    }

    const diff = prayer.getTime() - now.getTime();
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
        return `${diffHours} ساعة و ${diffMinutes} دقيقة`;
    }
    return `${diffMinutes} دقيقة`;
};

export const getTimeSincePrayer = (prayerTime: string): string => {
    if (!prayerTime || prayerTime === '--:--') return '--';

    const now = new Date();
    const [hours, minutes] = prayerTime.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes)) return '--';

    const prayer = new Date();
    prayer.setHours(hours, minutes, 0, 0);

    // If prayer time is in future (e.g. we returned Isha from yesterday), subtract a day
    if (prayer > now) {
        prayer.setDate(prayer.getDate() - 1);
    }

    const diff = now.getTime() - prayer.getTime();
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
        return `${diffHours} ساعة و ${diffMinutes} دقيقة`;
    }
    return `${diffMinutes} دقيقة`;
};

// Calculate Qibla direction
export const calculateQiblaDirection = (latitude: number, longitude: number): number => {
    // Kaaba coordinates
    const kaabaLat = 21.4225;
    const kaabaLng = 39.8262;

    const lat1 = (latitude * Math.PI) / 180;
    const lat2 = (kaabaLat * Math.PI) / 180;
    const dLng = ((kaabaLng - longitude) * Math.PI) / 180;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    let bearing = Math.atan2(y, x);
    bearing = (bearing * 180) / Math.PI;
    bearing = (bearing + 360) % 360;

    return bearing;
};
