import type { VoiceIntent, IntentType } from '../types';

// Voice command processor using keyword matching


// Voice command processor using keyword matching
export const processVoiceCommand = (transcript: string): VoiceIntent => {
    // Normalize text
    const lowerTranscript = transcript.toLowerCase();
    let cleanTranscript = transcript; // Start with original, will remove extracted parts

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

    // Summary keywords
    const summaryKeywords = [
        'ملخص', 'تقرير', 'أخبرني عن', 'ماذا لدي', 'وضع', // Arabic
        'resumen', 'reporte', 'dime sobre', 'qué tengo', 'estado' // Spanish
    ];

    // Location keywords
    const locationKeywords = [
        'احفظ موقعي', 'مكاني', 'هنا', 'موقع', 'خريطة', // Arabic
        'guardar ubicación', 'mi ubicación', 'aquí', 'mapa' // Spanish
    ];

    // --- Extraction Logic ---

    // 1. Extract Time
    // Matches: "at 5:30", "الساعة 5", "5 pm", "a las 5"
    const timeRegex = /(?:الساعة|في|at|a las)?\s*(\d{1,2}:\d{2})|(?:الساعة|في|at|a las)?\s*(\d{1,2})\s*(صباحا|مساء|ص|م|am|pm)?/i;
    const timeMatch = cleanTranscript.match(timeRegex);
    let time = undefined;

    if (timeMatch) {
        const fullMatch = timeMatch[0];
        // Check if it's a valid time format or just a number
        // We want to avoid matching just "5" in "5 apples" unless it has a time indicator
        const hasIndicator = fullMatch.match(/الساعة|في|at|a las|صباحا|مساء|ص|م|am|pm|:/);

        if (hasIndicator) {
            if (timeMatch[1]) { // 5:30
                time = timeMatch[1];
            } else if (timeMatch[2]) { // 5
                const hour = parseInt(timeMatch[2]);
                const period = timeMatch[3];

                if (period && (period.includes('م') || period.includes('pm') || period.includes('مساء')) && hour < 12) {
                    time = `${hour + 12}:00`;
                } else if (period && (period.includes('ص') || period.includes('am') || period.includes('صباحا')) && hour === 12) {
                    time = `00:00`;
                } else {
                    time = `${hour.toString().padStart(2, '0')}:00`;
                }
            }

            // Remove from transcript
            cleanTranscript = cleanTranscript.replace(fullMatch, '').trim();
        }
    }

    // 2. Extract Date
    const dateResult = extractDate(cleanTranscript);
    const date = dateResult.date;
    if (dateResult.match) {
        cleanTranscript = cleanTranscript.replace(dateResult.match, '').trim();
    }

    // 3. Extract Amount
    // Matches: "500 riyals", "500", "5k"
    const amountRegex = /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(ريال|دولار|جنيه|بيسو|peso|dollar|rs)?/i;
    const amountMatch = cleanTranscript.match(amountRegex);
    let amount = undefined;

    if (amountMatch) {
        // Only extract if there's a currency or if we suspect it's an expense/income command
        // For now, let's extract if it looks like a number and we later determine it's finance
        const val = parseFloat(amountMatch[1].replace(/,/g, ''));
        // If followed by currency, definitely amount
        if (amountMatch[2]) {
            amount = val;
            cleanTranscript = cleanTranscript.replace(amountMatch[0], '').trim();
        } else {
            // Store potential amount but don't remove yet unless we confirm intent
            // actually, let's keep it simple: if we find a number and it's not part of time, it's likely amount or quantity
            // But "5 apples" -> 5 is quantity. "500" -> amount.
            // Let's rely on intent later.
            amount = val;
            // Don't remove raw numbers yet to avoid breaking "5 apples"
        }
    }

    // Determine action (add or delete)
    const deleteKeywords = [
        'حذف', 'احذف', 'مسح', 'امسح', 'إلغاء', 'الغي', 'شيل', // Arabic
        'eliminar', 'borrar', 'cancelar', 'quitar' // Spanish
    ];
    const action = deleteKeywords.some(keyword => lowerTranscript.includes(keyword)) ? 'delete' : 'add';

    // Determine intent type
    let type: IntentType | 'summary' | 'location' = 'unknown';

    if (questionKeywords.some(keyword => lowerTranscript.includes(keyword))) {
        type = 'question';
    } else if (summaryKeywords.some(keyword => lowerTranscript.includes(keyword))) {
        type = 'summary';
    } else if (locationKeywords.some(keyword => lowerTranscript.includes(keyword))) {
        type = 'location';
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
            type = 'task';
            if (lowerTranscript.includes(' مع ') || lowerTranscript.includes(' con ')) {
                type = 'appointment';
            }
        } else if (amount) {
            type = 'expense';
        }
    }

    // Post-processing: If finance intent, remove the raw number if we found one
    if ((type === 'expense' || type === 'income') && amount && !cleanTranscript.match(/(ريال|دولار)/)) {
        // If we found an amount but didn't remove it because it lacked currency, remove it now
        const rawAmountMatch = cleanTranscript.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/);
        if (rawAmountMatch && parseFloat(rawAmountMatch[1]) === amount) {
            cleanTranscript = cleanTranscript.replace(rawAmountMatch[0], '').trim();
        }
    }

    // Extract section if present
    const section = extractSection(cleanTranscript);

    // Extract category for expenses
    let category: string | undefined;
    if (type === 'expense') {
        category = extractExpenseCategory(lowerTranscript);
    }

    // Clean up title
    // Remove keywords to leave just the subject
    // Remove "date" related words if date was extracted
    if (date) {
        cleanTranscript = cleanTranscript.replace(/(بتاريخ|في تاريخ|يوم)/g, '').trim();
    }

    // Simple cleanup: Remove common prepositions at start if they remain
    cleanTranscript = cleanTranscript.replace(/^(مع|with|con|لـ|for|para|في|in|en|عن|about|حول)\s+/i, '');

    // Remove specific "date" leftovers like "ال" if "يوم الاحد" was removed but "ال" remained (unlikely if regex is good, but safe to clean)
    cleanTranscript = cleanTranscript.replace(/\s+(ال|the)\s*$/i, '');

    return {
        type: type as IntentType, // Cast back to IntentType (need to update type definition separately)
        action,
        content: cleanTranscript.trim(),
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
const extractDate = (transcript: string): { date: string | undefined, match: string | undefined } => {
    const today = new Date();
    const lowerTranscript = transcript.toLowerCase();

    // 1. Relative dates
    if (lowerTranscript.includes('غدا') || lowerTranscript.includes('بكرة') || lowerTranscript.includes('بكرا')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const match = lowerTranscript.match(/(غدا|بكرة|بكرا)/)?.[0];
        return { date: tomorrow.toISOString().split('T')[0], match };
    }

    if (lowerTranscript.includes('بعد غد') || lowerTranscript.includes('بعد بكرة')) {
        const afterTomorrow = new Date(today);
        afterTomorrow.setDate(today.getDate() + 2);
        const match = lowerTranscript.match(/(بعد غد|بعد بكرة)/)?.[0];
        return { date: afterTomorrow.toISOString().split('T')[0], match };
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
        const foundName = day.names.find(name => lowerTranscript.includes(name));
        if (foundName) {
            const targetDay = day.offset;
            const currentDay = today.getDay();
            let daysToAdd = targetDay - currentDay;

            if (daysToAdd <= 0) {
                daysToAdd += 7; // Next occurrence
            }

            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + daysToAdd);

            // Try to match "Next Sunday" or just "Sunday"
            // Arabic: "يوم الأحد", "الأحد القادم"
            const matchRegex = new RegExp(`(يوم\\s*)?${foundName}(\\s*القادم)?`);
            const match = lowerTranscript.match(matchRegex)?.[0] || foundName;

            return { date: targetDate.toISOString().split('T')[0], match };
        }
    }

    return { date: undefined, match: undefined };
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
