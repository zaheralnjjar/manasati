import { useState, useEffect, useRef } from 'react';
import { Menu, MessageSquare, X, Home, Moon, CheckSquare, ShoppingCart, Wallet, ChefHat, GraduationCap, Settings, Mic, Send } from 'lucide-react';
import type { Page } from '../types';
import { getAssistantResponse } from '../services/gemini';
import { tools, executeTool } from '../services/tools';

interface FloatingButtonsProps {
    onNavigate: (page: Page) => void;
}

export default function FloatingButtons({ onNavigate }: FloatingButtonsProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [command, setCommand] = useState('');
    const [history, setHistory] = useState<{ type: 'user' | 'bot', text: string }[]>([
        { type: 'bot', text: 'مرحباً! أنا زاهر، مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟' }
    ]);

    const menuRef = useRef<HTMLDivElement>(null);
    const chatRef = useRef<HTMLDivElement>(null);

    // Click Outside Handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
            if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
                setShowChat(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Speech Recognition Setup
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'ar-SA';
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setCommand(transcript);
                handleSendCommand(transcript);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ar-SA';
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleNavigate = (page: string) => {
        onNavigate(page as Page);
        setShowMenu(false);
    };

    const handleSendCommand = async (cmdText: string = command) => {
        if (!cmdText.trim()) return;

        // Add user command
        const newHistory = [...history, { type: 'user' as const, text: cmdText }];
        setHistory(newHistory);
        setCommand('');

        try {
            // Convert history to Gemini format
            const geminiHistory = history.map(h => ({
                role: h.type === 'user' ? 'user' : 'model',
                parts: [{ text: h.text }]
            }));

            const response = await getAssistantResponse(geminiHistory, cmdText, tools);

            // Handle response
            // Note: The SDK might return the response directly or wrapped. 
            // Based on lint error "Property 'response' does not exist on type 'GenerateContentResponse'", 
            // we assume 'response' variable IS the GenerateContentResponse.
            // However, we need to be careful about the structure. 
            // Let's try to access candidates directly if it's the response object.
            const candidates = response.candidates;

            if (candidates && candidates[0].content && candidates[0].content.parts) {
                const part = candidates[0].content.parts[0];
                const text = part.text;

                if (text) {
                    setHistory(prev => [...prev, { type: 'bot', text: text }]);
                    speak(text);
                } else if (part.functionCall) {
                    // Execute tool
                    const toolName = part.functionCall.name;
                    const args = part.functionCall.args;

                    if (toolName) {
                        const toolResult = await executeTool(toolName, args);

                        // Show tool result
                        if (toolResult.success) {
                            setHistory(prev => [...prev, { type: 'bot', text: toolResult.message }]);
                            speak(toolResult.message);
                        } else {
                            setHistory(prev => [...prev, { type: 'bot', text: "حدث خطأ أثناء تنفيذ الأمر." }]);
                            speak("حدث خطأ أثناء تنفيذ الأمر.");
                        }
                    }
                }
            }
        } catch (error) {
            console.error(error);
            const errorMsg = 'عذراً، حدث خطأ في الاتصال بالخادم.';
            setHistory(prev => [...prev, { type: 'bot', text: errorMsg }]);
            speak(errorMsg);
        }
    };

    const menuItems = [
        { id: 'dashboard', label: 'الرئيسية', icon: Home, color: 'bg-slate-500' },
        { id: 'worship', label: 'عبادتي', icon: Moon, color: 'bg-primary-500' },
        { id: 'tasks', label: 'مهامي', icon: CheckSquare, color: 'bg-blue-500' },
        { id: 'shopping', label: 'تسوق', icon: ShoppingCart, color: 'bg-purple-500' },
        { id: 'budget', label: 'مالية', icon: Wallet, color: 'bg-green-500' },
        { id: 'cooking', label: 'مطبخي', icon: ChefHat, color: 'bg-orange-500' },
        { id: 'development', label: 'تطوير', icon: GraduationCap, color: 'bg-yellow-500' },
        { id: 'settings', label: 'إعدادات', icon: Settings, color: 'bg-slate-600' },
    ];

    return (
        <>
            {/* Top Right: Quick Menu */}
            <div className="fixed top-4 right-4 z-50" ref={menuRef}>
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="w-12 h-12 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-slate-700 transition-colors"
                >
                    {showMenu ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Menu Overlay */}
                {showMenu && (
                    <div className="absolute top-14 right-0 bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-2xl p-4 w-64 shadow-2xl animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 gap-3">
                            {menuItems.map(item => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNavigate(item.id)}
                                        className={`${item.color} p-3 rounded-xl flex flex-col items-center gap-2 text-white hover:opacity-90 transition-opacity`}
                                    >
                                        <Icon size={20} />
                                        <span className="font-bold text-xs">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Right: AI Assistant */}
            <div className="fixed bottom-24 right-4 z-50" ref={chatRef}>
                {/* Chat Window */}
                {showChat && (
                    <div className="absolute bottom-16 right-0 w-80 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 flex flex-col h-96">
                        <div className="bg-slate-900 p-3 flex items-center gap-3 border-b border-slate-700">
                            <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center relative">
                                <span className="text-lg">🤖</span>
                                <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-slate-900 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">المساعد زاهر</h3>
                                <p className="text-[10px] text-green-400">{isListening ? 'جاري الاستماع...' : 'مستعد للمساعدة'}</p>
                            </div>
                        </div>

                        <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-800/50">
                            {history.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-2 rounded-xl text-sm ${msg.type === 'user' ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-slate-700 text-slate-200 rounded-tl-none'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-3 bg-slate-900 border-t border-slate-700 flex gap-2">
                            <button
                                onClick={toggleListening}
                                className={`p-2 rounded-lg transition-colors ${isListening ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Mic size={20} className={isListening ? 'animate-pulse' : ''} />
                            </button>
                            <input
                                type="text"
                                value={command}
                                onChange={(e) => setCommand(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
                                placeholder="اكتب أمراً أو تحدث..."
                                className="flex-1 bg-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                            <button onClick={() => handleSendCommand()} className="bg-primary-500 text-white p-2 rounded-lg hover:bg-primary-600">
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setShowChat(!showChat)}
                    className="w-14 h-14 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
                >
                    {showChat ? <X size={28} /> : <MessageSquare size={28} />}
                </button>
            </div>
        </>
    );
}
