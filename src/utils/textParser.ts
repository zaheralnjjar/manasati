import type { PrayerTime } from '../types';

// Parse prayer times from pasted text (more reliable than OCR)
export const parsePrayerTimesFromText = (text: string): PrayerTime[] => {
    const prayerTimes: PrayerTime[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // Time pattern: matches times like "3:56 AM", "12:40 PM", "3:56", etc.
    const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/gi;

    let currentMonth = new Date().getMonth() + 1;
    let currentYear = new Date().getFullYear();

    // Try to extract month and year from text
    const monthYearMatch = text.match(/(\d{4})|Nov|Dic|Noviembre|Diciembre|November|December/i);
    if (monthYearMatch) {
        if (monthYearMatch[0].length === 4) {
            currentYear = parseInt(monthYearMatch[0]);
        }
        if (/Nov|Noviembre|November/i.test(text)) currentMonth = 11;
        if (/Dic|Diciembre|December/i.test(text)) currentMonth = 12;
    }

    for (const line of lines) {
        // Skip header lines
        if (/Fajr|Duhr|Asr|Maghrib|Isha|Salida|Dia|Yumada|العشاء|المغرب|العصر|الظهر|الفجر/i.test(line) && !/^\d/.test(line)) {
            continue;
        }

        // Extract all times from the line
        const times = Array.from(line.matchAll(timePattern));

        // If we have 5-7 times, it's likely a prayer times row
        if (times.length >= 5) {
            // Try to extract day from the line
            const firstNumber = line.match(/^(\d{1,2})/);
            if (!firstNumber) continue;

            const day = parseInt(firstNumber[1]);
            if (day < 1 || day > 31) continue;

            const date = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

            // Convert times to 24-hour format
            const convertTo24Hour = (hour: number, minute: number, period?: string): string => {
                let h = hour;
                if (period) {
                    const isPM = period.toUpperCase() === 'PM';
                    if (isPM && h !== 12) h += 12;
                    if (!isPM && h === 12) h = 0;
                }
                return `${h.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            };

            // Expected order: Fajr, Sunrise, Duhr, Asr, Maghrib, Isha
            const prayerTime: PrayerTime = {
                date,
                fajr: convertTo24Hour(parseInt(times[0][1]), parseInt(times[0][2]), times[0][3]),
                sunrise: times[1] ? convertTo24Hour(parseInt(times[1][1]), parseInt(times[1][2]), times[1][3]) : '06:00',
                dhuhr: times[2] ? convertTo24Hour(parseInt(times[2][1]), parseInt(times[2][2]), times[2][3]) : '12:00',
                asr: times[3] ? convertTo24Hour(parseInt(times[3][1]), parseInt(times[3][2]), times[3][3]) : '15:00',
                maghrib: times[4] ? convertTo24Hour(parseInt(times[4][1]), parseInt(times[4][2]), times[4][3]) : '18:00',
                isha: times[5] ? convertTo24Hour(parseInt(times[5][1]), parseInt(times[5][2]), times[5][3]) : '19:00',
            };

            prayerTimes.push(prayerTime);
        }
    }

    return prayerTimes;
};
