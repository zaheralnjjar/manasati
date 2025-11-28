import Tesseract from 'tesseract.js';
import type { PrayerTime } from '../types';

export const extractPrayerTimesFromImage = async (imageFile: File): Promise<PrayerTime[]> => {
    try {
        console.log('Starting OCR...');

        // Perform OCR on the image with better settings
        const result = await Tesseract.recognize(imageFile, 'ara+eng', {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                }
            },
        });

        const text = result.data.text;
        console.log('OCR Text:', text);

        // Try multiple parsing strategies
        let prayerTimes: PrayerTime[] = [];

        // Strategy 1: Parse as structured table
        prayerTimes = parseStructuredTable(text);

        if (prayerTimes.length === 0) {
            // Strategy 2: Parse line by line
            prayerTimes = parseLineByLine(text);
        }

        console.log('Extracted prayer times:', prayerTimes);
        return prayerTimes;
    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('فشل في قراءة الصورة. الرجاء المحاولة مرة أخرى أو إدخال الأوقات يدوياً.');
    }
};

// Parse structured table (like the Buenos Aires table)
const parseStructuredTable = (text: string): PrayerTime[] => {
    const prayerTimes: PrayerTime[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    // Time pattern: matches times like "3:56 AM", "12:40 PM", "3:56AM", etc.
    const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/gi;

    let currentMonth = new Date().getMonth() + 1; // Default to current month
    let currentYear = new Date().getFullYear();

    // Try to extract month and year from header
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
        if (/Fajr|Duhr|Asr|Maghrib|Isha|Salida|Dia|Yumada/i.test(line) && !/^\d/.test(line)) {
            continue;
        }

        // Extract all times from the line
        const times = Array.from(line.matchAll(timePattern));

        // Check if line starts with a day number
        // const dayMatch = line.match(dayPattern);

        // If we have 5-7 times and possibly a day, it's likely a prayer times row
        if (times.length >= 5) {
            let day: number;

            // Try to extract day from the line
            const firstNumber = line.match(/^(\d{1,2})/);
            if (firstNumber) {
                day = parseInt(firstNumber[1]);
            } else {
                continue; // Skip if no day found
            }

            // Validate day
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

// Parse line by line (fallback method)
const parseLineByLine = (text: string): PrayerTime[] => {
    const prayerTimes: PrayerTime[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    const prayerPatterns = {
        fajr: /فجر|الفجر|fajr|sobh/i,
        sunrise: /شروق|الشروق|sunrise|salida/i,
        dhuhr: /ظهر|الظهر|dhuhr|zuhr|duhr/i,
        asr: /عصر|العصر|asr/i,
        maghrib: /مغرب|المغرب|maghrib/i,
        isha: /عشاء|العشاء|isha/i,
    };

    const timePattern = /(\d{1,2}):(\d{2})/g;
    const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-]?(\d{2,4})?/;

    let currentDate: string | null = null;
    let currentPrayerTime: Partial<PrayerTime> = {};

    for (const line of lines) {
        // Try to extract date
        const dateMatch = line.match(datePattern);
        if (dateMatch) {
            const [, day, month, year] = dateMatch;
            const fullYear = year ? (year.length === 2 ? `20${year}` : year) : new Date().getFullYear().toString();
            currentDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            currentPrayerTime = { date: currentDate };
        }

        // Try to extract prayer times
        const times = Array.from(line.matchAll(timePattern));

        if (times.length > 0) {
            for (const [key, pattern] of Object.entries(prayerPatterns)) {
                if (pattern.test(line)) {
                    const time = times[0];
                    const formattedTime = `${time[1].padStart(2, '0')}:${time[2]}`;
                    currentPrayerTime[key as keyof PrayerTime] = formattedTime;
                }
            }
        }

        // If we have a complete prayer time entry, save it
        if (
            currentPrayerTime.date &&
            currentPrayerTime.fajr &&
            currentPrayerTime.dhuhr &&
            currentPrayerTime.asr &&
            currentPrayerTime.maghrib &&
            currentPrayerTime.isha
        ) {
            prayerTimes.push(currentPrayerTime as PrayerTime);
            currentPrayerTime = { date: currentDate || undefined };
        }
    }

    return prayerTimes;
};

// Keep the old function for compatibility
export const extractPrayerTimesFromTable = parseStructuredTable;
