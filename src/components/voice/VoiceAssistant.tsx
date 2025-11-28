import { useState, useEffect } from 'react';
import { Send, Bot, X, Mic, Globe, History as HistoryIcon, Lightbulb, Calendar, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { processVoiceCommand, isSpeechRecognitionSupported, getSpeechRecognition } from '../../utils/voiceProcessor';
import { getToday } from '../../utils/dateHelpers';
import { addTaskToSystem, deleteTaskFromSystem } from '../../utils/taskHelper';
import { addShoppingItemToSystem, removeShoppingItemFromSystem, getShoppingListFromSystem } from '../../utils/shoppingHelper';
import { addGoalToSystem } from '../../utils/goalHelper';
import { aiHelper } from '../../utils/aiHelper';
import { storage } from '../../utils/storage';
import type { Task } from '../../types';

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
    const { addIncome, addExpense } = useFinanceStore();

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
    const [upcomingAppointments, setUpcomingAppointments] = useState<Task[]>([]);

    useEffect(() => {
        if (isSpeechRecognitionSupported()) {
            const recog = getSpeechRecognition();
            if (recog) {
                recog.lang = language === 'ar' ? 'ar-SA' : 'es-ES';
                recog.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setInputText(transcript);
                    handleVoiceSubmit(transcript);
                };
                recog.onend = () => setIsListening(false);
                setRecognition(recog);
            }
        }
    }, [language]);

    // Load proactive content on open
    useEffect(() => {
        if (isVoiceActive) {
            setDailyAdvice(ISLAMIC_ADVICE[Math.floor(Math.random() * ISLAMIC_ADVICE.length)]);
            setProductivityTip(PRODUCTIVITY_TIPS[Math.floor(Math.random() * PRODUCTIVITY_TIPS.length)]);

            const tasks = storage.get<Task[]>('tasks') || [];
            const appointments = tasks
                .filter(t => t.section === 'appointment' && !t.completed && t.dueDate)
                .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
                .slice(0, 3);
            setUpcomingAppointments(appointments);

            // Load history
            const savedHistory = storage.get<string[]>('voiceHistory') || [];
            setHistory(savedHistory);
        }
    }, [isVoiceActive]);

    // Auto-start listening when activated
    useEffect(() => {
        if (isVoiceActive && recognition && !isListening) {
            try {
                recognition.start();
                setIsListening(true);
            } catch (e) {
                // Ignore error if already started
            }
        }
    }, [isVoiceActive, recognition]);

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

    const handleVoiceSubmit = async (text: string) => {
        if (!text.trim()) return;
        setIsProcessing(true);
        setFeedback('');
        setAiResponse(null);
        addToHistory(text);

        try {
            const intent = processVoiceCommand(text);
            await handleIntent(intent);
        } catch (error) {
            setFeedback(language === 'ar' ? 'حدث خطأ في معالجة الأمر' : 'Error procesando el comando');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleVoiceSubmit(inputText);
        setInputText('');
    };

    const handleIntent = async (intent: any) => {
        try {
            const targetDate = intent.date || getToday();
            const action = intent.action || 'add';

            if (action === 'delete') {
                handleDeleteIntent(intent);
                return;
            }

            switch (intent.type) {
                case 'task':
                    addTaskToSystem(intent.content, {
                        dueDate: targetDate,
                        recurrence: { type: 'none', specificTime: intent.time },
                        section: (intent.section as any) || 'general',
                        priority: 'medium',
                    });
                    setFeedback(language === 'ar'
                        ? `✓ تمت إضافة المهمة ${intent.date ? `ليوم ${new Date(intent.date).toLocaleDateString('ar-SA', { weekday: 'long' })}` : ''} ${intent.section ? `(قسم ${intent.section})` : ''}`
                        : `✓ Tarea añadida`);
                    break;

                case 'appointment':
                    addTaskToSystem(intent.content, {
                        dueDate: intent.time ? `${targetDate}T${intent.time}` : targetDate,
                        section: 'appointment',
                        priority: 'medium',
                    });
                    setFeedback(language === 'ar'
                        ? `✓ تمت إضافة الموعد ${intent.time ? `الساعة ${intent.time}` : ''}`
                        : `✓ Cita añadida`);
                    break;

                case 'goal':
                    addGoalToSystem(intent.content, {
                        type: 'book',
                        frequency: 'once'
                    });
                    setFeedback(language === 'ar' ? '✓ تمت إضافة الهدف' : '✓ Meta añadida');
                    break;

                case 'question':
                    setFeedback(language === 'ar' ? 'جاري البحث عن الإجابة...' : 'Buscando respuesta...');
                    try {
                        const answer = await aiHelper.askScholar(intent.content);
                        setAiResponse(answer);
                        setFeedback(language === 'ar' ? '✓ تم العثور على الإجابة' : '✓ Respuesta encontrada');
                    } catch (e) {
                        setFeedback(language === 'ar' ? 'عذراً، حدث خطأ أثناء البحث' : 'Error buscando respuesta');
                    }
                    break;

                case 'shopping':
                    const itemName = intent.content.replace(/(اشتري|شراء|تسوق|أضف|اضف|إلى|قائمة|التسوق|comprar|compra|lista|traer)/gi, '').trim();
                    addShoppingItemToSystem(itemName);
                    setFeedback(language === 'ar' ? '✓ تمت إضافة العنصر للتسوق' : '✓ Añadido a la lista de compras');
                    break;

                case 'income':
                    if (intent.amount) {
                        await addIncome({
                            amount: intent.amount,
                            type: 'variable',
                            description: intent.content,
                            date: targetDate,
                            recurring: false,
                        });
                        setFeedback(language === 'ar' ? '✓ تمت إضافة الدخل' : '✓ Ingreso añadido');
                    } else {
                        setFeedback(language === 'ar' ? 'يرجى تحديد المبلغ' : 'Por favor especifique el monto');
                    }
                    break;

                case 'expense':
                    if (intent.amount) {
                        await addExpense({
                            amount: intent.amount,
                            category: intent.category as any || 'أخرى',
                            description: intent.content,
                            date: targetDate,
                        });
                        setFeedback(language === 'ar' ? '✓ تمت إضافة المصروف' : '✓ Gasto añadido');
                    } else {
                        setFeedback(language === 'ar' ? 'يرجى تحديد المبلغ' : 'Por favor especifique el monto');
                    }
                    break;

                default:
                    setFeedback(language === 'ar' ? 'لم أفهم الأمر، حاول بصيغة أخرى' : 'No entendí el comando');
            }
        } catch (error) {
            console.error(error);
            setFeedback(language === 'ar' ? 'حدث خطأ في تنفيذ الأمر' : 'Error ejecutando el comando');
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

    return (
        <>
            {/* Floating Trigger Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setVoiceActive(true)}
                className="fixed bottom-24 left-6 z-[9990] bg-primary-500 text-white p-4 rounded-full shadow-lg shadow-primary-500/30 flex items-center justify-center"
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
                                        {!feedback && !aiResponse && (
                                            <div className="space-y-4 mb-6">
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

                                                {/* Upcoming Appointments */}
                                                {upcomingAppointments.length > 0 && (
                                                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                                                        <div className="flex items-center gap-2 mb-2 text-purple-400">
                                                            <Calendar size={16} />
                                                            <span className="text-xs font-bold">
                                                                {language === 'ar' ? 'مواعيدك القادمة' : 'Próximas citas'}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {upcomingAppointments.map(app => (
                                                                <div key={app.id} className="flex justify-between items-center text-sm">
                                                                    <span className="text-white">{app.title}</span>
                                                                    <span className="text-slate-400 text-xs">
                                                                        {new Date(app.dueDate!).toLocaleDateString('ar-SA', { weekday: 'short', hour: 'numeric', minute: 'numeric' })}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="text-center mb-6">
                                            <p className="text-slate-300 text-sm mb-4">
                                                {language === 'ar' ? 'كيف يمكنني مساعدتك اليوم؟' : '¿Cómo puedo ayudarte hoy?'}
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
                                        {(feedback || aiResponse) && (
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
