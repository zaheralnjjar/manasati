import type { VoiceIntent, IntentType } from '../types';

// Voice command processor using keyword matching


// Voice command processor using keyword matching
export const processVoiceCommand = (transcript: string): VoiceIntent => {
    // Normalize text
    const lowerTranscript = transcript.toLowerCase();
    const cleanTranscript = lowerTranscript; // Keep original for extraction

    // --- Keywords (Arabic & Spanish) ---

    // Task keywords
    const taskKeywords = [
        'مهمة', 'تذكير', 'ذكرني', 'عمل', 'سوي', 'افعل', // Arabic
        'tarea', 'recordatorio', 'recuérdame', 'hacer', 'trabajo' // Spanish
    ];

    // Appointment keywords
    const appointmentKeywords = [
        'موعد', 'اجتماع', 'لقاء', 'دكتور', 'طبيب', 'زيارة', // Arabic
        'cita', 'reunión', 'doctor', 'médico', 'visita' // Spanish
    ];
    // Shopping keywords
    const shoppingKeywords = [
        'اشتري', 'شراء', 'تسوق', 'قائمة', 'جيب', 'هات', // Arabic
        'comprar', 'compra', 'lista', 'supermercado', 'traer' // Spanish
    ];
    // Income keywords
    const incomeKeywords = [
        'راتب', 'دخل', 'مكافأة', 'إيداع', 'تحويل لي', 'استلمت', // Arabic
        'salario', 'sueldo', 'ingreso', 'bono', 'depósito', 'recibí' // Spanish
    ];
    // Expense keywords
    const expenseKeywords = [
        'مصروف', 'صرف', 'دفع', 'فاتورة', 'حساب', 'دفعت', 'اشتريت', 'شريت', // Arabic
        'gasto', 'pago', 'pagar', 'factura', 'cuenta', 'pagué', 'compré' // Spanish
    ];

    // Question keywords
    const questionKeywords = [
        'ما حكم', 'هل يجوز', 'فتوى', 'سؤال', 'متى', 'كيف', 'لماذا', 'معنى', 'تفسير', 'رأي', 'الشيخ', 'ابن باز', 'العثيمين', 'الخميس', // Arabic
        'fatwa', 'pregunta', 'es permitido', 'qué opina', 'sheikh', 'significado' // Spanish
    ];

    // Goal keywords
    const goalKeywords = [
        'هدف', 'أهداف', 'خطة', 'تطوير', 'تعلم', 'قراءة', 'ختمة', 'ورد', // Arabic
        'meta', 'objetivo', 'plan', 'desarrollo', 'aprender', 'leer' // Spanish
    ];

    // --- Extraction Logic ---

    // Extract time (Arabic & Spanish)
    // Arabic: الساعة 5, 5:30, الخامسة
    // Spanish: a las 5, 5:30
    const timeMatch = cleanTranscript.match(/(\d{1,2}:\d{2})|(\d{1,2})\s*(صباحا|مساء|ص|م|am|pm)?|الساعة\s*(\d{1,2})|a las\s*(\d{1,2})/);
    let time = undefined;
    if (timeMatch) {
        if (timeMatch[1]) time = timeMatch[1]; // 5:30
        else if (timeMatch[3] || timeMatch[4]) { // الساعة 5 or 5 صباحا
            const hour = parseInt(timeMatch[2] || timeMatch[4]);
            const period = timeMatch[3];
            if (period && (period.includes('م') || period.includes('pm') || period.includes('مساء')) && hour < 12) {
                time = `${hour + 12}:00`;
            } else if (period && (period.includes('ص') || period.includes('am') || period.includes('صباحا')) && hour === 12) {
                time = `00:00`;
            } else {
                time = `${hour.toString().padStart(2, '0')}:00`;
            }
        } else if (timeMatch[5]) { // a las 5 (Spanish)
            const hour = parseInt(timeMatch[5]);
            time = `${hour.toString().padStart(2, '0')}:00`;
        }
    }

    // Extract date (Arabic & Spanish)
    const date = extractDate(cleanTranscript); // Helper needs update or check

    // Extract section if present
    const section = extractSection(cleanTranscript);

    // Extract amount (Arabic & Spanish)
    // Supports: 500, 2,700,000, 5k
    const amountMatch = cleanTranscript.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(ريال|دولار|جنيه|بيسو|peso|dollar|rs)?/);
    let amount = undefined;
    if (amountMatch) {
        amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    // Determine action (add or delete)
    const deleteKeywords = [
        'حذف', 'احذف', 'مسح', 'امسح', 'إلغاء', 'الغي', 'شيل', // Arabic
        'eliminar', 'borrar', 'cancelar', 'quitar' // Spanish
    ];
    const action = deleteKeywords.some(keyword => lowerTranscript.includes(keyword)) ? 'delete' : 'add';

    // Determine intent type
    let type: IntentType = 'unknown';

    if (questionKeywords.some(keyword => lowerTranscript.includes(keyword))) {
        type = 'question';
    } else if (goalKeywords.some(keyword => lowerTranscript.includes(keyword))) {
        type = 'goal';
    } else if (incomeKeywords.some(keyword => lowerTranscript.includes(keyword))) {
        type = 'income';
    } else if (expenseKeywords.some(keyword => lowerTranscript.includes(keyword))) {
        type = 'expense';
    } else if (shoppingKeywords.some(keyword => lowerTranscript.includes(keyword))) {
        type = 'shopping';
    } else if (appointmentKeywords.some(keyword => lowerTranscript.includes(keyword))) {
        type = 'appointment';
    } else if (taskKeywords.some(keyword => lowerTranscript.includes(keyword))) {
        type = 'task';
    } else {
        // Implicit Intent Detection
        if (time || date) {
            // If time/date is present but no specific keyword, assume Appointment or Task
            // "Tomorrow at 5" -> Appointment/Task
            type = 'task'; // Default to task, but maybe appointment if it sounds like one?
            // Let's stick to task for safety, user can say "Appointment" to be specific.
            // Or if it has "with" (مع / con) -> Appointment
            if (lowerTranscript.includes(' مع ') || lowerTranscript.includes(' con ')) {
                type = 'appointment';
            }
        } else if (amount) {
            // If amount is present, assume Expense (unless it's income keyword)
            type = 'expense';
        }
    }

    // Extract category for expenses
    let category: string | undefined;
    if (type === 'expense') {
        category = extractExpenseCategory(lowerTranscript);
    }

    return {
        type,
        action,
        content: cleanTranscript,
        date,
        time,
        amount,
        category,
        section,
    };
};

// Extract task section from transcript
const extractSection = (transcript: string): string | undefined => {
    const lower = transcript.toLowerCase();

    if (lower.includes('عمل') || lower.includes('شغل') || lower.includes('وظيفة')) return 'tasks'; // Using 'tasks' for Work/General tasks
    if (lower.includes('صحة') || lower.includes('علاج') || lower.includes('دواء') || lower.includes('رياضة')) return 'health';
    if (lower.includes('عبادة') || lower.includes('صلاة') || lower.includes('قرآن') || lower.includes('ذكر')) return 'worship';
    if (lower.includes('فكرة') || lower.includes('أفكار')) return 'idea';
    if (lower.includes('تطوير') || lower.includes('تعلم') || lower.includes('قراءة')) return 'self-dev';
    if (lower.includes('تسوق') || lower.includes('شراء')) return 'shopping';

    return undefined;
};

// Extract date from transcript
const extractDate = (transcript: string): string | undefined => {
    const today = new Date();
    const lowerTranscript = transcript.toLowerCase();

    // 1. Relative dates
    if (lowerTranscript.includes('غدا') || lowerTranscript.includes('بكرة') || lowerTranscript.includes('بكرا')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    if (lowerTranscript.includes('بعد غد') || lowerTranscript.includes('بعد بكرة')) {
        const afterTomorrow = new Date(today);
        afterTomorrow.setDate(today.getDate() + 2);
        return afterTomorrow.toISOString().split('T')[0];
    }

    // 2. Days of the week
    const days = [
        { names: ['أحد', 'احد'], offset: 0 }, // Sunday
        { names: ['اثنين', 'إثنين'], offset: 1 },
        { names: ['ثلاثاء', 'تلاتاء'], offset: 2 },
        { names: ['أربعاء', 'اربعاء'], offset: 3 },
        { names: ['خميس'], offset: 4 },
        { names: ['جمعة'], offset: 5 },
        { names: ['سبت'], offset: 6 },
    ];

    for (const day of days) {
        if (day.names.some(name => lowerTranscript.includes(name))) {
            const targetDay = day.offset;
            const currentDay = today.getDay();
            let daysToAdd = targetDay - currentDay;

            if (daysToAdd <= 0) {
                daysToAdd += 7; // Next occurrence
            }

            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + daysToAdd);
            return targetDate.toISOString().split('T')[0];
        }
    }

    return undefined;
};



// Extract expense category from transcript
const extractExpenseCategory = (transcript: string): string => {
    if (transcript.includes('فاتورة') || transcript.includes('كهرباء') ||
        transcript.includes('ماء') || transcript.includes('انترنت')) {
        return 'فواتير';
    }
    if (transcript.includes('طعام') || transcript.includes('أكل') ||
        transcript.includes('مطعم') || transcript.includes('غداء')) {
        return 'طعام';
    }
    if (transcript.includes('نقل') || transcript.includes('مواصلات') ||
        transcript.includes('بنزين') || transcript.includes('تاكسي')) {
        return 'نقل';
    }
    if (transcript.includes('ترفيه') || transcript.includes('سينما') ||
        transcript.includes('لعب')) {
        return 'ترفيه';
    }
    if (transcript.includes('صحة') || transcript.includes('دواء') ||
        transcript.includes('طبيب') || transcript.includes('مستشفى')) {
        return 'صحة';
    }
    if (transcript.includes('تعليم') || transcript.includes('دراسة') ||
        transcript.includes('كتاب') || transcript.includes('دورة')) {
        return 'تعليم';
    }

    return 'أخرى';
};

// Check if browser supports speech recognition
export const isSpeechRecognitionSupported = (): boolean => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

// Get speech recognition instance
export const getSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA'; // Arabic
    recognition.continuous = false;
    recognition.interimResults = false;

    return recognition;
};
