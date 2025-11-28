import { useState, useEffect } from 'react';

import {
    calculatePrayerTimes,
    getNextPrayer,
    getCurrentPrayer,
    getTimeUntilPrayer,
    getTimeSincePrayer,
    type PrayerTimeResult
} from '../utils/prayerTimes';

export const usePrayerSync = () => {
    const [prayers, setPrayers] = useState<PrayerTimeResult[]>([]);
    const [nextPrayer, setNextPrayer] = useState<PrayerTimeResult | null>(null);
    const [currentPrayer, setCurrentPrayer] = useState<PrayerTimeResult | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [timeSince, setTimeSince] = useState<string>('');

    // Default location (Riyadh) if not available
    const [location, setLocation] = useState({ lat: 24.7136, lng: 46.6753 });

    useEffect(() => {
        // Try to get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.log('Using default location:', error);
                }
            );
        }
    }, []);

    useEffect(() => {
        const updatePrayerTimes = () => {
            const todayPrayers = calculatePrayerTimes(location.lat, location.lng);
            setPrayers(todayPrayers);

            const next = getNextPrayer(todayPrayers);
            setNextPrayer(next);

            const current = getCurrentPrayer(todayPrayers);
            setCurrentPrayer(current);

            if (next) {
                setTimeRemaining(getTimeUntilPrayer(next.time));
            }

            if (current) {
                setTimeSince(getTimeSincePrayer(current.time));
            }
        };

        // Initial update
        updatePrayerTimes();

        // Update every minute
        const interval = setInterval(updatePrayerTimes, 60000);

        return () => clearInterval(interval);
    }, [location.lat, location.lng]);

    return {
        prayers,
        nextPrayer,
        currentPrayer,
        timeRemaining,
        timeSince,
        location
    };
};
