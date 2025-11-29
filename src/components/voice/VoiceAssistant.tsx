import { useState, useEffect, useRef } from 'react';
import { Send, Bot, X, Mic, Globe, History as HistoryIcon, Lightbulb, Calendar, Target, MapPin, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useSpiritualStore } from '../../store/useSpiritualStore';
import { useDevelopmentStore } from '../../store/useDevelopmentStore';
import { useMasariStore } from '../../store/useMasariStore';
import { processVoiceCommand, isSpeechRecognitionSupported, getSpeechRecognition } from '../../utils/voiceProcessor';
import { getToday } from '../../utils/dateHelpers';
import { addTaskToSystem, deleteTaskFromSystem } from '../../utils/taskHelper';
import { addShoppingItemToSystem, removeShoppingItemFromSystem, getShoppingListFromSystem } from '../../utils/shoppingHelper';
import { addGoalToSystem } from '../../utils/goalHelper';
import { aiHelper } from '../../utils/aiHelper';
import { storage } from '../../utils/storage';
import type { Task, IntentType, VoiceIntent } from '../../types';

// Conversation States
type ConversationState = 'IDLE' | 'LISTENING_INITIAL' | 'PROCESSING' | 'ASKING_SLOT' | 'EXECUTING';

// Form Data for Multi-turn
interface FormData {
    intentType?: IntentType;
    data: any;
    missingField?: string;
    question?: string;
}

const ISLAMIC_ADVICE = [
    "قال رسول الله ﷺ: «كلمتان خفيفتان على اللسان، ثقيلتان في الميزان، حبيبتان إلى الرحمن: سبحان الله وبحمده، سبحان الله العظيم»",
    "قال رسول الله ﷺ: «من صلى عليّ صلاة صلى الله عليه بها عشراً»",
    "لا تنس أذكار الصباح والمساء، فهي حصن المسلم.",
    "قال تعالى: ﴿ألا بذكر الله تطمئن القلوب﴾",
    "صلاة الضحى صدقة عن كل مفصل من مفاصلك."
];

const PRODUCTIVITY_TIPS = [
    "ابدأ يومك بأهم مهمة (Eat That Frog).",
    "استخدم تقنية البومودورو: 25 دقيقة عمل، 5 دقائق راحة.",
    "خطط ليومك في الليلة السابقة.",
    "تخلص من المشتتات أثناء العمل العميق.",
    "اجعل أهدافك ذكية (SMART): محددة، قابلة للقياس، قابلة للتحقيق، ذات صلة، ومحددة بوقت."
];

export default function VoiceAssistant() {
    const { isVoiceActive, setVoiceActive } = useAppStore();
    const { addIncome, addExpense, incomes, expenses } = useFinanceStore();
    const { readingGoals } = useSpiritualStore();
    const { goals } = useDevelopmentStore();
    const { addSavedLocation } = useMasariStore();

    const [inputText, setInputText] = useState('');
    const [feedback, setFeedback] = useState('');
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);
    const [language, setLanguage] = useState<'ar' | 'es'>('ar');
    const [history, setHistory] = useState<string[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [dailyAdvice, setDailyAdvice] = useState('');
    const [productivityTip, setProductivityTip] = useState('');

    // State Machine
    const [conversationState, setConversationState] = useState<ConversationState>('IDLE');
    const [formData, setFormData] = useState<FormData>({ data: {} });
    const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if (isSpeechRecognitionSupported()) {
            const recog = getSpeechRecognition();
            if (recog) {
                recog.lang = language === 'ar' ? 'ar-SA' : 'es-ES';
                recog.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setInputText(transcript);
                    handleVoiceInput(transcript);
                };
                recog.onend = () => setIsListening(false);
                setRecognition(recog);
            }
        }
    }, [language]);

    // Auto-start and Proactive Content
    useEffect(() => {
        if (isVoiceActive) {
            setDailyAdvice(ISLAMIC_ADVICE[Math.floor(Math.random() * ISLAMIC_ADVICE.length)]);
            setProductivityTip(PRODUCTIVITY_TIPS[Math.floor(Math.random() * PRODUCTIVITY_TIPS.length)]);

            const savedHistory = storage.get<string[]>('voiceHistory') || [];
            setHistory(savedHistory);

            // Auto-start listening
            if (recognition && !isListening) {
                try {
                    setConversationState('LISTENING_INITIAL');
                    recognition.start();
                    setIsListening(true);
                } catch (e) { /* Ignore */ }
            }
        } else {
            // Reset state on close
            setConversationState('IDLE');
            setFormData({ data: {} });
            setFeedback('');
            setAiResponse(null);
            if (isListening && recognition) recognition.stop();
        }
    }, [isVoiceActive]);

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            if (synthesisRef.current) window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language === 'ar' ? 'ar-SA' : 'es-ES';
            synthesisRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        }
    };

    const toggleListening = () => {
        if (!recognition) return;
        if (isListening) {
            recognition.stop();
        } else {
            setIsListening(true);
            recognition.start();
        }
    };

    const addToHistory = (text: string) => {
        const newHistory = [text, ...history].slice(0, 10);
        setHistory(newHistory);
        storage.set('voiceHistory', newHistory);
    };

    const handleVoiceInput = async (text: string) => {
        if (!text.trim()) return;
        addToHistory(text);

        if (conversationState === 'LISTENING_INITIAL' || conversationState === 'IDLE') {
            // New Command
            setIsProcessing(true);
            setFeedback('');
            setAiResponse(null);
            try {
                const intent = processVoiceCommand(text);
                await processIntent(intent);
            } catch (error) {
                setFeedback(language === 'ar' ? 'حدث خطأ في معالجة الأمر' : 'Error procesando el comando');
            } finally {
                setIsProcessing(false);
            }
        } else if (conversationState === 'ASKING_SLOT') {
            // Filling a slot
            await handleSlotFill(text);
        }
    };

    const processIntent = async (intent: VoiceIntent) => {
        // Handle immediate actions (Summary, Location, Question, Delete)
        if (intent.action === 'delete') {
            handleDeleteIntent(intent);
            setConversationState('IDLE');
            return;
        }

        if (intent.type === 'question') {
            setFeedback(language === 'ar' ? 'جاري البحث عن الإجابة...' : 'Buscando respuesta...');
            try {
                const answer = await aiHelper.askScholar(intent.content);
                setAiResponse(answer);
                setFeedback(language === 'ar' ? '✓ تم العثور على الإجابة' : '✓ Respuesta encontrada');
                speak(language === 'ar' ? 'إليك الإجابة' : 'Aquí está la respuesta');
            } catch (e) {
                setFeedback(language === 'ar' ? 'عذراً، حدث خطأ أثناء البحث' : 'Error buscando respuesta');
            }
            setConversationState('IDLE');
            return;
        }

        if (intent.type === 'summary') {
            handleSummary();
            setConversationState('IDLE');
            return;
        }

        if (intent.type === 'location') {
            handleSaveLocation();
            setConversationState('IDLE');
            return;
        }

        // Handle Form-based intents (Task, Goal, Finance, Shopping)
        const newFormData: FormData = {
            intentType: intent.type,
            data: {
                content: intent.content,
                date: intent.date,
                time: intent.time,
                amount: intent.amount,
                category: intent.category,
                section: intent.section
            }
        };

        checkMissingSlots(newFormData);
    };

    const checkMissingSlots = (form: FormData) => {
        const { intentType, data } = form;
        let missing = '';
        let question = '';

        if (intentType === 'task' || intentType === 'appointment') {
            if (!data.content || data.content === 'مهمة' || data.content === 'موعد') {
                missing = 'content';
                question = language === 'ar' ? 'ما هو عنوان المهمة؟' : '¿Cuál es el título de la tarea?';
            }
        } else if (intentType === 'goal') {
            if (!data.content || data.content === 'هدف') {
                missing = 'content';
                question = language === 'ar' ? 'ما هو هدفك؟' : '¿Cuál es tu meta?';
            }
        } else if (intentType === 'income' || intentType === 'expense') {
            if (!data.amount) {
                missing = 'amount';
                question = language === 'ar' ? 'كم المبلغ؟' : '¿Cuánto es el monto?';
            }
        } else if (intentType === 'shopping') {
            if (!data.content || data.content === 'شراء') {
                missing = 'content';
                question = language === 'ar' ? 'ماذا تريد أن تشتري؟' : '¿Qué quieres comprar?';
            }
        }

        if (missing) {
            setFormData({ ...form, missingField: missing, question });
            setConversationState('ASKING_SLOT');
            setFeedback(question);
            speak(question);
            // Re-enable listening for answer
            setTimeout(() => {
                if (recognition) recognition.start();
                setIsListening(true);
            }, 1000);
        } else {
            executeAction(form);
        }
    };

    const handleSlotFill = async (text: string) => {
        const { missingField, data } = formData;
        const newData = { ...data };

        if (missingField === 'content') {
            newData.content = text;
        } else if (missingField === 'amount') {
            // Extract number from text
            const match = text.match(/(\d+)/);
            if (match) {
                newData.amount = parseFloat(match[0]);
            }
        }

        const updatedForm = { ...formData, data: newData, missingField: undefined };
        checkMissingSlots(updatedForm);
    };

    const executeAction = async (form: FormData) => {
        setConversationState('EXECUTING');
        const { intentType, data } = form;
        const targetDate = data.date || getToday();

        try {
            switch (intentType) {
                case 'task':
                    addTaskToSystem(data.content, {
                        dueDate: targetDate,
                        recurrence: { type: 'none', specificTime: data.time },
                        section: (data.section as any) || 'general',
                        priority: 'medium',
                    });
                    setFeedback(language === 'ar' ? `✓ تمت إضافة المهمة: ${data.content}` : `✓ Tarea añadida: ${data.content}`);
                    break;

                case 'appointment':
                    addTaskToSystem(data.content, {
                        dueDate: data.time ? `${targetDate}T${data.time}` : targetDate,
                        section: 'appointment',
                        priority: 'medium',
                    });
                    setFeedback(language === 'ar' ? `✓ تم إضافة الموعد: ${data.content}` : `✓ Cita añadida: ${data.content}`);
                    break;

                case 'goal':
                    addGoalToSystem(data.content, {
                        type: 'custom',
                        frequency: 'daily'
                    });
                    setFeedback(language === 'ar' ? `✓ تم إضافة الهدف: ${data.content}` : `✓ Meta añadida: ${data.content}`);
                    break;

                case 'income':
                    await addIncome({
                        amount: data.amount,
                        category: 'variable',
                        description: data.content || 'دخل',
                        date: targetDate,
                        recurring: false,
                    });
                    setFeedback(language === 'ar' ? `✓ تم تسجيل الدخل: ${data.amount}` : `✓ Ingreso registrado: ${data.amount}`);
                    break;

                case 'expense':
                    await addExpense({
                        amount: data.amount,
                        category: data.category || 'أخرى',
                        description: data.content || 'مصروف',
                        date: targetDate,
                    });
                    setFeedback(language === 'ar' ? `✓ تم تسجيل المصروف: ${data.amount}` : `✓ Gasto registrado: ${data.amount}`);
                    break;

                case 'shopping':
                    addShoppingItemToSystem(data.content);
                    setFeedback(language === 'ar' ? `✓ تمت الإضافة للتسوق: ${data.content}` : `✓ Añadido a compras: ${data.content}`);
                    break;
            }
            speak(language === 'ar' ? 'تم التنفيذ' : 'Hecho');
        } catch (error) {
            console.error(error);
            setFeedback(language === 'ar' ? 'حدث خطأ' : 'Error');
        }

        setConversationState('IDLE');
        setFormData({ data: {} });
    };

    const handleSummary = () => {
        // Generate summary text
        const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
        const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
        const activeGoals = goals.filter(g => g.status === 'active').length;
        const readingCount = readingGoals.length;

        const summaryAr = `لديك ${readingCount} أهداف قراءة، و ${activeGoals} أهداف تطويرية. مجموع الدخل ${totalIncome} ومجموع المصاريف ${totalExpense}.`;
        const summaryEs = `Tienes ${readingCount} metas de lectura y ${activeGoals} metas de desarrollo. Ingresos totales ${totalIncome} y gastos ${totalExpense}.`;

        const text = language === 'ar' ? summaryAr : summaryEs;
        setAiResponse(text);
        setFeedback(language === 'ar' ? 'ملخص حالتك' : 'Resumen de estado');
        speak(text);
    };

    const handleSaveLocation = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    addSavedLocation({
                        name: language === 'ar' ? `موقع محفوظ ${new Date().toLocaleTimeString()}` : `Ubicación guardada`,
                        category: 'place',
                        lat: latitude,
                        lng: longitude,
                        streetAddress: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
                        notes: 'Saved via Voice Assistant'
                    });
                    const msg = language === 'ar' ? 'تم حفظ موقعك الحالي بنجاح' : 'Ubicación guardada exitosamente';
                    setFeedback(`✓ ${msg}`);
                    speak(msg);
                },
                () => {
                    const msg = language === 'ar' ? 'تعذر الحصول على الموقع' : 'No se pudo obtener la ubicación';
                    setFeedback(msg);
                    speak(msg);
                }
            );
        } else {
            setFeedback(language === 'ar' ? 'الموقع غير مدعوم' : 'Geolocalización no soportada');
        }
    };

    const handleDeleteIntent = (intent: any) => {
        const searchTerm = intent.content.replace(/(حذف|احذف|مسح|امسح|إلغاء|الغي|شيل|eliminar|borrar|cancelar|quitar)/gi, '').trim();

        if (intent.type === 'task' || intent.type === 'appointment' || intent.type === 'unknown') {
            const tasks = storage.get<Task[]>('tasks') || [];
            const taskToDelete = tasks.find(t => t.title.includes(searchTerm));
            if (taskToDelete) {
                deleteTaskFromSystem(taskToDelete.id);
                setFeedback(language === 'ar' ? `✓ تم حذف: ${taskToDelete.title}` : `✓ Eliminado: ${taskToDelete.title}`);
                return;
            }
        }

        if (intent.type === 'shopping' || intent.type === 'unknown') {
            const shoppingList = getShoppingListFromSystem();
            const itemToDelete = shoppingList.find(i => i.name.includes(searchTerm));
            if (itemToDelete) {
                removeShoppingItemFromSystem(itemToDelete.id);
                setFeedback(language === 'ar' ? `✓ تم حذف: ${itemToDelete.name}` : `✓ Eliminado: ${itemToDelete.name}`);
                return;
            }
        }

        setFeedback(language === 'ar' ? `لم أجد "${searchTerm}" للحذف` : `No encontré "${searchTerm}" para eliminar`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleVoiceInput(inputText);
        setInputText('');
    };

    return (
        <>
            {/* Floating Trigger Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setVoiceActive(true)}
                className="fixed bottom-24 right-6 z-[9990] bg-primary-500/50 backdrop-blur-sm text-white p-4 rounded-full shadow-lg shadow-primary-500/20 flex items-center justify-center border border-white/10"
            >
                <Bot size={24} />
            </motion.button>

            {/* Modal Interface */}
            <AnimatePresence>
                {isVoiceActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setVoiceActive(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            {/* Header */}
                            <div className="bg-slate-900/50 p-4 flex justify-between items-center border-b border-slate-700 shrink-0">
                                <div className="flex items-center gap-2">
                                    <Bot className="text-primary-500" size={24} />
                                    <h3 className="font-bold text-white">
                                        {language === 'ar' ? 'المساعد الذكي' : 'Asistente Inteligente'}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setLanguage(prev => prev === 'ar' ? 'es' : 'ar')}
                                        className="flex items-center gap-1 px-2 py-1 rounded bg-slate-700 text-xs font-bold text-slate-300 hover:text-white"
                                    >
                                        <Globe size={14} />
                                        {language === 'ar' ? 'عربي' : 'ES'}
                                    </button>
                                    <button
                                        onClick={() => setShowHistory(!showHistory)}
                                        className={`p-1.5 rounded-lg transition-colors ${showHistory ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        <HistoryIcon size={18} />
                                    </button>
                                    <button
                                        onClick={() => setVoiceActive(false)}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6 overflow-y-auto flex-1">
                                {showHistory ? (
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-slate-400 mb-2">
                                            {language === 'ar' ? 'سجل الأوامر' : 'Historial'}
                                        </h4>
                                        {history.length === 0 ? (
                                            <p className="text-center text-slate-500 text-sm py-4">
                                                {language === 'ar' ? 'لا يوجد سجل' : 'No hay historial'}
                                            </p>
                                        ) : (
                                            history.map((cmd, idx) => (
                                                <div key={idx} className="bg-slate-700/50 p-3 rounded-lg flex justify-between items-center">
                                                    <span className="text-white text-sm">{cmd}</span>
                                                    <button
                                                        onClick={() => {
                                                            setInputText(cmd);
                                                            setShowHistory(false);
                                                        }}
                                                        className="text-primary-400 text-xs hover:underline"
                                                    >
                                                        {language === 'ar' ? 'استخدام' : 'Usar'}
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {/* Welcome / Proactive Content */}
                                        {!feedback && !aiResponse && conversationState === 'IDLE' && (
                                            <div className="space-y-4 mb-6">
                                                {/* Suggestions Chips */}
                                                <div className="flex flex-wrap gap-2 justify-center mb-4">
                                                    {[
                                                        { icon: FileText, label: language === 'ar' ? 'ملخص' : 'Resumen', cmd: language === 'ar' ? 'أعطني ملخص' : 'Dame un resumen' },
                                                        { icon: MapPin, label: language === 'ar' ? 'حفظ موقعي' : 'Guardar ubicación', cmd: language === 'ar' ? 'احفظ موقعي' : 'Guarda mi ubicación' },
                                                        { icon: Target, label: language === 'ar' ? 'هدف جديد' : 'Nueva meta', cmd: language === 'ar' ? 'إضافة هدف' : 'Añadir meta' },
                                                    ].map((chip, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => handleVoiceInput(chip.cmd)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-full text-xs text-white transition-colors border border-slate-600"
                                                        >
                                                            <chip.icon size={12} />
                                                            {chip.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Daily Advice */}
                                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1 text-emerald-400">
                                                        <Lightbulb size={16} />
                                                        <span className="text-xs font-bold">
                                                            {language === 'ar' ? 'حكمة اليوم' : 'Sabiduría del día'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-200 leading-relaxed">
                                                        {dailyAdvice}
                                                    </p>
                                                </div>

                                                {/* Productivity Tip */}
                                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1 text-blue-400">
                                                        <Target size={16} />
                                                        <span className="text-xs font-bold">
                                                            {language === 'ar' ? 'نصيحة إنتاجية' : 'Tip de productividad'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-200 leading-relaxed">
                                                        {productivityTip}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="text-center mb-6">
                                            <p className="text-slate-300 text-sm mb-4">
                                                {conversationState === 'ASKING_SLOT' ? feedback : (language === 'ar' ? 'كيف يمكنني مساعدتك اليوم؟' : '¿Cómo puedo ayudarte hoy?')}
                                            </p>
                                            {isListening && (
                                                <div className="flex justify-center gap-1 mb-4">
                                                    {[1, 2, 3].map(i => (
                                                        <motion.div
                                                            key={i}
                                                            animate={{ height: [10, 20, 10] }}
                                                            transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                                            className="w-1 bg-primary-500 rounded-full"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <form onSubmit={handleSubmit} className="relative">
                                            <input
                                                type="text"
                                                value={inputText}
                                                onChange={(e) => setInputText(e.target.value)}
                                                placeholder={language === 'ar' ? "اكتب أو تحدث..." : "Escribe o habla..."}
                                                className="w-full bg-slate-700 text-white rounded-xl py-3 px-4 pl-12 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                                autoFocus
                                            />
                                            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-1">
                                                {recognition && (
                                                    <button
                                                        type="button"
                                                        onClick={toggleListening}
                                                        className={`p-2 rounded-lg transition-colors ${isListening ? 'text-red-500 bg-red-500/10' : 'text-slate-400 hover:text-primary-500'}`}
                                                    >
                                                        <Mic size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    type="submit"
                                                    disabled={!inputText.trim() || isProcessing}
                                                    className="p-2 bg-primary-500 rounded-lg text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <Send size={18} />
                                                </button>
                                            </div>
                                        </form>

                                        {/* Feedback Area */}
                                        {(feedback || aiResponse) && conversationState !== 'ASKING_SLOT' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`mt-4 p-3 rounded-lg text-center text-sm font-medium ${feedback.startsWith('✓')
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    : 'bg-slate-700 text-slate-300'
                                                    }`}
                                            >
                                                {feedback && <div className="mb-2">{feedback}</div>}
                                                {aiResponse && (
                                                    <div className="text-right text-white mt-2 pt-2 border-t border-slate-600 whitespace-pre-wrap leading-relaxed">
                                                        {aiResponse}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
