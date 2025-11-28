// Date and time helper functions

export const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
};

export const formatTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toTimeString().split(' ')[0].substring(0, 5);
};

export const getToday = (): string => {
    return formatDate(new Date());
};

export const getTodayWithTime = (): string => {
    return new Date().toISOString();
};

export const isToday = (dateString: string): boolean => {
    return formatDate(dateString) === getToday();
};

export const isPast = (dateString: string): boolean => {
    return new Date(dateString) < new Date(getToday());
};

export const isFuture = (dateString: string): boolean => {
    return new Date(dateString) > new Date(getToday());
};

export const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
};

export const getDaysRemainingInMonth = (): number => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const currentDay = today.getDate();
    return daysInMonth - currentDay;
};

export const getArabicDayName = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[d.getDay()];
};

export const getArabicMonthName = (monthIndex: number): string => {
    const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[monthIndex];
};

export const formatArabicDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = d.getDate();
    const month = getArabicMonthName(d.getMonth());
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
};

export const getWeekDayNumber = (dayName: string): number => {
    const days: Record<string, number> = {
        'الأحد': 0,
        'الاثنين': 1,
        'الثلاثاء': 2,
        'الأربعاء': 3,
        'الخميس': 4,
        'الجمعة': 5,
        'السبت': 6,
    };
    return days[dayName] ?? 0;
};

export const addDays = (date: Date | string, days: number): Date => {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

export const diffInDays = (date1: Date | string, date2: Date | string): number => {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
