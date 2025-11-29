import { useState, useEffect } from 'react';
import { useSpiritualStore } from '../store/useSpiritualStore';
import {
    getNextPrayer,
    getCurrentPrayer,
    getTimeUntil,
    getTimeSince,
    prayerNames
} from '../utils/prayerHelpers';
import type { PrayerName } from '../types';

export interface DashboardPrayer {
    name: PrayerName;
    arabicName: string;
    time: string;
}

export const usePrayerSync = () => {
    const { prayerTimes } = useSpiritualStore();
    const [prayers, setPrayers] = useState<DashboardPrayer[]>([]);
    const [nextPrayer, setNextPrayer] = useState<DashboardPrayer | null>(null);
    const [currentPrayer, setCurrentPrayer] = useState<DashboardPrayer | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [timeSince, setTimeSince] = useState<string>('');

    useEffect(() => {
        const updatePrayerState = () => {
            const today = new Date().toISOString().split('T')[0];
            const todayPrayers = prayerTimes.find(pt => pt.date === today);

            if (todayPrayers) {
                // Map to Dashboard format
                const prayersList: DashboardPrayer[] = [
                    { name: 'fajr', arabicName: prayerNames.fajr, time: todayPrayers.fajr },
                    { name: 'sunrise', arabicName: prayerNames.sunrise, time: todayPrayers.sunrise },
                    { name: 'dhuhr', arabicName: prayerNames.dhuhr, time: todayPrayers.dhuhr },
                    { name: 'asr', arabicName: prayerNames.asr, time: todayPrayers.asr },
                    { name: 'maghrib', arabicName: prayerNames.maghrib, time: todayPrayers.maghrib },
                    { name: 'isha', arabicName: prayerNames.isha, time: todayPrayers.isha },
                ];
                setPrayers(prayersList);

                // Next Prayer
                const next = getNextPrayer(prayerTimes);
                if (next) {
                    setNextPrayer({
                        name: next.prayer,
                        arabicName: prayerNames[next.prayer],
                        time: next.time
                    });
                    setTimeRemaining(getTimeUntil(next.time));
                } else {
                    setNextPrayer(null);
                    setTimeRemaining('');
                }

                // Current Prayer
                const current = getCurrentPrayer(prayerTimes);
                if (current) {
                    setCurrentPrayer({
                        name: current.prayer,
                        arabicName: prayerNames[current.prayer],
                        time: current.time
                    });
                    setTimeSince(getTimeSince(current.time));
                } else {
                    setCurrentPrayer(null);
                    setTimeSince('');
                }
            } else {
                // Fallback or empty state if no data for today
                setPrayers([]);
                setNextPrayer(null);
                setCurrentPrayer(null);
            }
        };

        // Initial update
        updatePrayerState();

        // Update every second for accurate countdown
        const interval = setInterval(updatePrayerState, 1000);

        return () => clearInterval(interval);
    }, [prayerTimes]);

    return {
        prayers,
        nextPrayer,
        currentPrayer,
        timeRemaining,
        timeSince
    };
};
