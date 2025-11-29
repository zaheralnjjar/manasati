// Type definitions for all modules in Minasati app

// ============= SPIRITUAL MODULE =============
export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerTime {
    date: string;
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
}

export interface PrayerSettings {
    notifyAtAdhan: boolean;
    notifyBeforeAdhan: boolean;
    minutesBeforeAdhan: number;
    selectedPrayers: string[];
}

export interface PrayerTimesData {
    date: string;
    prayers: PrayerTime[]; // This might need adjustment if PrayerTime is now a Day
    source: 'uploaded' | 'gps';
    location?: {
        latitude: number;
        longitude: number;
        city?: string;
    };
}

export interface PrayerNotificationSettings {
    enabled: boolean;
    preAdhan: boolean; // Notify before adhan
    duringAdhan: boolean; // Notify during adhan
    minutesBefore: number;
}

export interface ReadingGoal {
    id: string;
    bookName: string;
    totalPages: number;
    currentPage: number;
    deadlineDays: number;
    pagesPerDay: number;
    startDate: string;
    isQuran: boolean;
    mode?: 'tilawah' | 'hifz'; // Reading or Memorization
    completed: boolean;
    // New fields for enhanced Quran goals
    scopeType?: 'juz' | 'surah' | 'verses' | 'khatmah';
    scopeValue?: string;
    dailyTarget?: number;
    durationDays?: number;
}

export interface AdhkarCounter {
    id: string;
    name: string;
    count: number;
    target: number;
    type: 'morning' | 'evening' | 'general';
}

// Azkar Item for individual azkar
export interface AzkarItem {
    id: string;
    text: string;
    targetCount: number;
    currentCount: number;
    category: 'morning' | 'evening' | 'general' | 'mosque' | 'custom';
    isDaily?: boolean;
}

// Quran Goal (alias for ReadingGoal with isQuran=true)
export type QuranGoal = ReadingGoal;

// ============= PRODUCTIVITY MODULE =============
export type TaskSection = 'general' | 'worship' | 'tasks' | 'health' | 'appointment' | 'idea' | 'prayer' | 'azkar' | 'quran' | 'reading' | 'shopping' | 'self-dev';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'planned' | 'completed';

export interface Task {
    id: string;
    title: string;
    completed: boolean;
    date: string; // ISO date string
    time?: string;
    section?: string;
    priority?: 'high' | 'medium' | 'low';
    status?: TaskStatus;
    description?: string;
    text?: string; // Optional text content for tasks
    dueDate?: string;
    lastCompletedDate?: string;
    recurrence: {
        type: 'daily' | 'weekly' | 'monthly' | 'none';
        frequency?: number; // e.g., 2 times a day
        times?: string[]; // ["08:00", "14:00"]
        days?: number[]; // [1, 3, 5] for Mon, Wed, Fri
        specificTime?: string; // For voice commands
    };
    fromVoice?: boolean;
    rolledOver?: boolean; // Indicates if task was moved from previous day
}

export interface Appointment {
    id: string;
    title: string;
    date: string;
    time: string;
    location?: string;
    notes?: string;
    googleMapsLink?: string;
}

export interface YouTubeVideo {
    id: string;
    url: string;
    videoId: string;
    title?: string;
    thumbnail?: string;
    addedDate: string;
}

export interface Habit {
    id: string;
    name: string;
    tracking: Record<string, boolean>; // { '2025-11-26': true, ... }
}

// ============= LIFESTYLE MODULE =============
export type ShoppingCategory = 'لحوم' | 'خضروات' | 'بقالة' | 'ألبان' | 'أخرى';

// Extended category with metadata (for custom categories)
export interface ShoppingCategoryExtended {
    id: string;
    name: string;
    isDefault: boolean;
}

export interface ShoppingItem {
    id: string;
    name: string;
    category: string;
    addedDate: string;
    purchased: boolean;
    completed?: boolean; // Alias for purchased
    priority?: 'urgent' | 'medium' | 'low';
}

export interface Recipe {
    id: string;
    title: string;
    ingredients: string[];
    steps: string[];
    cookingTime?: number;
    servings?: number;
    category?: string;
}

export interface CookingSession {
    id: string;
    recipeId: string;
    startTime: string;
    endTime?: string;
    checkedIngredients: string[];
    currentStep: number;
    notes?: string;
}

// ============= MASARI (GPS) MODULE =============
export interface SavedLocation {
    id: string;
    name: string;
    lat: number;
    lng: number;
    address?: string;
    category: 'parking' | 'place' | 'photo';
    icon?: 'car' | 'home' | 'work' | 'store' | 'pin';
    color?: string;
    photo?: string; // base64 encoded image
    photoTitle?: string; // custom title for photo
    streetAddress?: string; // reverse geocoded street address
    notes?: string;
    savedAt: number;
}

// ============= FINANCE MODULE =============
export type IncomeType = 'fixed' | 'variable';
export type ExpenseCategory = 'فواتير' | 'طعام' | 'نقل' | 'ترفيه' | 'صحة' | 'تعليم' | 'أخرى';
export type BudgetCategory = ExpenseCategory | 'دخل' | 'مدخرات';

// Extended budget category with metadata
export interface BudgetCategoryExtended {
    id: string;
    name: string;
    type: 'income' | 'expense' | 'savings';
    isDefault: boolean;
}

export interface Income {
    id: string;
    amount: number;
    type: IncomeType;
    description: string;
    date: string;
    recurring: boolean;
}

export interface TransactionMetadata {
    receiptNumber?: string;
    paymentMethod?: string;
    notes?: string;
    [key: string]: any;
}

export interface Transaction {
    id: string;
    amount: number;
    type: 'income' | 'expense' | 'savings';
    category: string;
    description: string;
    date: string;
    recurring?: boolean;
    metadata?: TransactionMetadata;
}

export interface DevelopmentGoal {
    id: string;
    title: string;
    type: 'book' | 'video' | 'course' | 'habit' | string;
    frequency: 'once' | 'weekly' | 'monthly' | 'daily';
    status: 'active' | 'completed';
    createdAt: string;
    link?: string;
}

export interface BookGoal {
    id: string;
    title: string;
    totalPages: number;
    durationDays: number;
    startDate: string;
    currentPage: number;
    dailyTarget: number;
    isCompleted: boolean;
}

export interface Expense {
    id: string;
    amount: number;
    category: ExpenseCategory;
    description: string;
    date: string;
}

export interface BudgetSummary {
    totalIncome: number;
    totalExpenses: number;
    currentBalance: number;
    fixedBills: number;
    safeDailySpend: number;
    daysRemainingInMonth: number;
}

// ============= SETTINGS =============
export interface WidgetVisibility {
    nextPrayer: boolean;
    nextTask: boolean;
    budget: boolean;
    readingProgress: boolean;
}

export interface NavVisibility {
    dashboard: boolean;
    worship: boolean;
    tasks: boolean;
    masari: boolean;
    development: boolean;
    shopping: boolean;
    budget: boolean;
}

export interface AppSettings {
    theme: 'dark' | 'light';
    widgetVisibility: WidgetVisibility;
    navVisibility: NavVisibility;
    notificationsEnabled: boolean;
    tickerSpeed: number;
    language: 'ar';
    prayerSettings?: PrayerSettings;
}

// ============= VOICE ASSISTANT =============
export type IntentType = 'task' | 'appointment' | 'shopping' | 'income' | 'expense' | 'goal' | 'question' | 'unknown';

export interface VoiceIntent {
    type: IntentType;
    action?: 'add' | 'delete';
    content: string;
    date?: string;
    time?: string;
    amount?: number;
    category?: string;
    section?: string;
}

export type Page = 'dashboard' | 'worship' | 'tasks' | 'masari' | 'development' | 'shopping' | 'budget' | 'settings' | 'prayer';
