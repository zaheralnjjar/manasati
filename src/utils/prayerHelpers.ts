import type { PrayerTime, PrayerName } from '../types';

export const prayerNames: Record<PrayerName, string> = {
    fajr: 'الفجر',
    sunrise: 'الشروق',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء',
};

export const getNextPrayer = (prayerTimes: PrayerTime[]): { prayer: PrayerName; time: string; date: string } | null => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Find today's prayer times
    const todayPrayers = prayerTimes.find(pt => pt.date === today);
    if (!todayPrayers) return null;

    const prayers: { name: PrayerName; time: string }[] = [
        { name: 'fajr', time: todayPrayers.fajr },
        { name: 'dhuhr', time: todayPrayers.dhuhr },
        { name: 'asr', time: todayPrayers.asr },
        { name: 'maghrib', time: todayPrayers.maghrib },
        { name: 'isha', time: todayPrayers.isha },
    ];

    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Find next prayer today
    for (const prayer of prayers) {
        if (prayer.time > currentTime) {
            return { prayer: prayer.name, time: prayer.time, date: today };
        }
    }

    // If no prayer left today, return Fajr of tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    const tomorrowPrayers = prayerTimes.find(pt => pt.date === tomorrowDate);

    if (tomorrowPrayers) {
        return { prayer: 'fajr', time: tomorrowPrayers.fajr, date: tomorrowDate };
    }

    return null;
};

export const getCurrentPrayer = (prayerTimes: PrayerTime[]): { prayer: PrayerName; time: string } | null => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const todayPrayers = prayerTimes.find(pt => pt.date === today);
    if (!todayPrayers) return null;

    const prayers: { name: PrayerName; time: string }[] = [
        { name: 'fajr', time: todayPrayers.fajr },
        { name: 'dhuhr', time: todayPrayers.dhuhr },
        { name: 'asr', time: todayPrayers.asr },
        { name: 'maghrib', time: todayPrayers.maghrib },
        { name: 'isha', time: todayPrayers.isha },
    ];

    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Find the last prayer that has passed
    let currentPrayer = null;
    for (const prayer of prayers) {
        if (prayer.time <= currentTime) {
            currentPrayer = { prayer: prayer.name, time: prayer.time };
        } else {
            break;
        }
    }

    return currentPrayer;
};

export const getTimeUntil = (targetTime: string): string => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const target = new Date(`${today}T${targetTime}:00`);
    const diff = target.getTime() - now.getTime();

    if (diff < 0) {
        return '00:00:00';
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const getTimeSince = (time: string): string => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);

    const prayerTime = new Date();
    prayerTime.setHours(hours, minutes, 0, 0);

    const diff = now.getTime() - prayerTime.getTime();

    if (diff < 0) {
        return '00:00';
    }

    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHours.toString().padStart(2, '0')}:${diffMinutes.toString().padStart(2, '0')}`;
};

// Format time string (HH:MM)
export const formatTime = (time: string | undefined): string => {
    if (!time) return '--:--';

    const [hours, minutes] = time.split(':');
    if (!hours || !minutes) return '--:--';

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};
