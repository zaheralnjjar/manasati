import { createEvents, type EventAttributes } from 'ics';
import type { PrayerTime, PrayerSettings, Task, Appointment } from '../types';

const prayerNamesArabic: Record<string, string> = {
    fajr: 'صلاة الفجر',
    dhuhr: 'صلاة الظهر',
    asr: 'صلاة العصر',
    maghrib: 'صلاة المغرب',
    isha: 'صلاة العشاء',
};

export const generateICS = (
    prayerTimes: PrayerTime[],
    settings: PrayerSettings,
    tasks: Task[] = [],
    appointments: Appointment[] = [],
    selectedDates?: string[]
): string | null => {
    const events: EventAttributes[] = [];

    // 1. Prayer Times
    const filteredPrayerTimes = selectedDates
        ? prayerTimes.filter(pt => selectedDates.includes(pt.date))
        : prayerTimes;

    filteredPrayerTimes.forEach(prayerTime => {
        const [year, month, day] = prayerTime.date.split('-').map(Number);

        settings.selectedPrayers.forEach(prayerName => {
            const time = prayerTime[prayerName as keyof PrayerTime] as string;
            if (!time) return;

            const [hours, minutes] = time.split(':').map(Number);

            const event: EventAttributes = {
                start: [year, month, day, hours, minutes],
                duration: { minutes: 30 },
                title: prayerNamesArabic[prayerName] || prayerName,
                description: `وقت ${prayerNamesArabic[prayerName]}`,
                status: 'CONFIRMED',
                busyStatus: 'FREE',
                alarms: [],
            };

            if (settings.notifyAtAdhan) {
                event.alarms?.push({
                    action: 'audio',
                    trigger: { minutes: 0, before: true },
                    description: `حان وقت ${prayerNamesArabic[prayerName]}`,
                });
            }

            if (settings.notifyBeforeAdhan && settings.minutesBeforeAdhan > 0) {
                event.alarms?.push({
                    action: 'audio',
                    trigger: { minutes: settings.minutesBeforeAdhan, before: true },
                    description: `${prayerNamesArabic[prayerName]} بعد ${settings.minutesBeforeAdhan} دقيقة`,
                });
            }

            events.push(event);
        });
    });

    // 2. Tasks
    tasks.forEach(task => {
        if (!task.dueDate) return;
        const [datePart, timePart] = task.dueDate.split('T');
        const [year, month, day] = datePart.split('-').map(Number);

        let hours = 9, minutes = 0; // Default to 9 AM if no time
        if (timePart) {
            [hours, minutes] = timePart.split(':').map(Number);
        }

        events.push({
            start: [year, month, day, hours, minutes],
            duration: { minutes: 60 },
            title: `مهمة: ${task.title}`,
            description: task.description || '',
            status: task.completed ? 'CONFIRMED' : 'TENTATIVE',
            busyStatus: 'BUSY',
        });
    });

    // 3. Appointments
    appointments.forEach(app => {
        const [year, month, day] = app.date.split('-').map(Number);
        const [hours, minutes] = app.time.split(':').map(Number);

        events.push({
            start: [year, month, day, hours, minutes],
            duration: { minutes: 60 },
            title: `موعد: ${app.title}`,
            description: app.location || '',
            status: 'CONFIRMED',
            busyStatus: 'BUSY',
        });
    });

    const { error, value } = createEvents(events);

    if (error) {
        console.error('Error creating ICS:', error);
        return null;
    }

    return value || null;
};

export const downloadICS = (icsContent: string, filename: string = 'prayer-times.ics') => {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};
