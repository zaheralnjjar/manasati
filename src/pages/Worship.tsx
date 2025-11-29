import { useState } from 'react';
import PrayerSection from '../components/worship/PrayerSection';
import AzkarSection from '../components/worship/AzkarSection';
import QuranSection from '../components/worship/QuranSection';

type WorshipTab = 'prayer' | 'azkar' | 'quran';

export default function Worship() {
    const [activeTab, setActiveTab] = useState<WorshipTab>('prayer');

    return (
        <div className="pb-20">
            {/* Top Navigation Tabs */}
            <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 pt-2 pb-2">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('prayer')}
                        className={`flex-1 min-w-[100px] py-2 px-4 rounded-full text-sm font-bold transition-all ${activeTab === 'prayer'
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        الصلاة
                    </button>
                    <button
                        onClick={() => setActiveTab('azkar')}
                        className={`flex-1 min-w-[100px] py-2 px-4 rounded-full text-sm font-bold transition-all ${activeTab === 'azkar'
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        واذكر ربك
                    </button>
                    <button
                        onClick={() => setActiveTab('quran')}
                        className={`flex-1 min-w-[100px] py-2 px-4 rounded-full text-sm font-bold transition-all ${activeTab === 'quran'
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        القرآن والقراءة
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[calc(100vh-140px)]">
                {activeTab === 'prayer' && <PrayerSection />}
                {activeTab === 'azkar' && <AzkarSection />}
                {activeTab === 'quran' && <QuranSection />}
            </div>
        </div>
    );
}
