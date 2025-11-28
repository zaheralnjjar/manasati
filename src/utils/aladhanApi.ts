import type { PrayerTime } from '../types';

// Buenos Aires coordinates
const BUENOS_AIRES_LAT = -34.6037;
const BUENOS_AIRES_LNG = -58.3816;

// Calculation methods
export const CALCULATION_METHODS = {
    ISNA: 2,           // Islamic Society of North America
    MWL: 3,            // Muslim World League
    MAKKAH: 4,         // Umm Al-Qura (Saudi Arabia)
    EGYPTIAN: 5,       // Egyptian General Authority of Survey
    TEHRAN: 7,         // University of Tehran
    TURKEY: 13,        // Turkey Diyanet
} as const;

export const CALCULATION_METHOD_NAMES: Record<number, string> = {
    2: 'ISNA - أمريكا الشمالية',
    3: 'MWL - رابطة العالم الإسلامي',
    4: 'أم القرى - السعودية',
    5: 'الهيئة المصرية',
    7: 'جامعة طهران',
    13: 'تركيا',
};

interface AladhanDay {
    timings: {
        Fajr: string;
        Sunrise: string;
        Dhuhr: string;
        Asr: string;
        Maghrib: string;
        Isha: string;
    };
    date: {
        gregorian: {
            date: string; // DD-MM-YYYY
            day: string;
            month: {
                number: number;
            };
            year: string;
        };
    };
}

interface AladhanResponse {
    code: number;
    status: string;
    data: AladhanDay[];
}

export const fetchPrayerTimesFromAladhan = async (
    year: number,
    month: number,
    method: number = CALCULATION_METHODS.ISNA
): Promise<PrayerTime[]> => {
    try {
        console.log(`Fetching prayer times for ${year}-${month} with method ${method}...`);

        const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${BUENOS_AIRES_LAT}&longitude=${BUENOS_AIRES_LNG}&method=${method}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: AladhanResponse = await response.json();

        if (data.code !== 200 || !data.data) {
            throw new Error('Invalid response from Aladhan API');
        }

        console.log(`Received ${data.data.length} days from Aladhan API`);

        // Convert Aladhan format to our PrayerTime format
        const prayerTimes: PrayerTime[] = data.data.map((day) => {
            const { gregorian } = day.date;
            const date = `${gregorian.year}-${gregorian.month.number.toString().padStart(2, '0')}-${gregorian.day.padStart(2, '0')}`;

            return {
                date,
                fajr: convertTo24Hour(day.timings.Fajr),
                sunrise: convertTo24Hour(day.timings.Sunrise),
                dhuhr: convertTo24Hour(day.timings.Dhuhr),
                asr: convertTo24Hour(day.timings.Asr),
                maghrib: convertTo24Hour(day.timings.Maghrib),
                isha: convertTo24Hour(day.timings.Isha),
            };
        });

        return prayerTimes;
    } catch (error) {
        console.error('Aladhan API Error:', error);
        throw new Error('فشل في جلب أوقات الصلاة من الإنترنت. تحقق من الاتصال بالإنترنت.');
    }
};

// Convert time from "HH:MM (TIMEZONE)" to "HH:MM"
const convertTo24Hour = (time: string): string => {
    // Aladhan returns times like "05:30 (-03)" or "05:30"
    const match = time.match(/(\d{2}):(\d{2})/);
    if (match) {
        return `${match[1]}:${match[2]}`;
    }
    return time;
};

// Helper to fetch current month
export const fetchCurrentMonthPrayerTimes = async (method: number = CALCULATION_METHODS.ISNA): Promise<PrayerTime[]> => {
    const now = new Date();
    return fetchPrayerTimesFromAladhan(now.getFullYear(), now.getMonth() + 1, method);
};

// Helper to fetch next month
export const fetchNextMonthPrayerTimes = async (method: number = CALCULATION_METHODS.ISNA): Promise<PrayerTime[]> => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return fetchPrayerTimesFromAladhan(nextMonth.getFullYear(), nextMonth.getMonth() + 1, method);
};
