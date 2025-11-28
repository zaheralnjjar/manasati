import { Calendar, Moon } from 'lucide-react';

interface Holiday {
    date: string;
    name: string;
    type: 'national' | 'islamic';
    note?: string;
}

export const HOLIDAYS_2025: Holiday[] = [
    // National Holidays (Argentina)
    { date: '2025-01-01', name: 'رأس السنة الميلادية', type: 'national' },
    { date: '2025-03-03', name: 'كرنفال', type: 'national' },
    { date: '2025-03-04', name: 'كرنفال', type: 'national' },
    { date: '2025-03-24', name: 'يوم الذكرى للحقيقة والعدالة', type: 'national' },
    { date: '2025-04-02', name: 'يوم المحاربين القدامى (المالفيناس)', type: 'national' },
    { date: '2025-04-18', name: 'الجمعة العظيمة', type: 'national' },
    { date: '2025-05-01', name: 'عيد العمال', type: 'national' },
    { date: '2025-05-25', name: 'يوم ثورة مايو', type: 'national' },
    { date: '2025-06-20', name: 'يوم العلم', type: 'national' },
    { date: '2025-07-09', name: 'عيد الاستقلال', type: 'national' },
    { date: '2025-08-17', name: 'ذكرى سان مارتن', type: 'national', note: 'قد ينقل إلى 18 أغسطس' },
    { date: '2025-10-12', name: 'يوم احترام التنوع الثقافي', type: 'national', note: 'قد ينقل إلى 13 أكتوبر' },
    { date: '2025-11-20', name: 'يوم السيادة الوطنية', type: 'national', note: 'قد ينقل إلى 24 نوفمبر' },
    { date: '2025-12-08', name: 'عيد الحبل بلا دنس', type: 'national' },
    { date: '2025-12-25', name: 'عيد الميلاد', type: 'national' },

    // Islamic Holidays (Approximate)
    { date: '2025-01-27', name: 'الإسراء والمعراج', type: 'islamic', note: 'تاريخ تقريبي' },
    { date: '2025-03-01', name: 'بداية شهر رمضان', type: 'islamic', note: 'فلكياً' },
    { date: '2025-03-30', name: 'عيد الفطر المبارك', type: 'islamic', note: 'فلكياً' },
    { date: '2025-06-05', name: 'يوم عرفة', type: 'islamic', note: 'فلكياً' },
    { date: '2025-06-06', name: 'عيد الأضحى المبارك', type: 'islamic', note: 'فلكياً' },
    { date: '2025-06-26', name: 'رأس السنة الهجرية 1447', type: 'islamic', note: 'فلكياً' },
    { date: '2025-07-05', name: 'يوم عاشوراء', type: 'islamic', note: 'فلكياً' },
    { date: '2025-09-05', name: 'المولد النبوي الشريف', type: 'islamic', note: 'فلكياً' },
];

export default function HolidaysList() {
    const today = new Date().toISOString().split('T')[0];

    // Sort holidays by date
    const sortedHolidays = [...HOLIDAYS_2025].sort((a, b) => a.date.localeCompare(b.date));

    // Filter to show upcoming or recent (optional, showing all for year is better for reference)

    return (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mt-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Calendar className="text-primary-500" />
                <span>العطل الرسمية والمناسبات الإسلامية (2025)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* National Holidays */}
                <div>
                    <h4 className="text-md font-bold text-slate-300 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        عطلات الأرجنتين
                    </h4>
                    <div className="space-y-2">
                        {sortedHolidays.filter(h => h.type === 'national').map((holiday, idx) => (
                            <div key={idx} className={`flex justify-between items-center p-2 rounded hover:bg-slate-700/50 ${holiday.date >= today ? 'text-white' : 'text-slate-500'}`}>
                                <span>{holiday.name}</span>
                                <div className="text-right">
                                    <span className="text-sm font-mono block" dir="ltr">
                                        {new Date(holiday.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}
                                    </span>
                                    {holiday.note && <span className="text-xs text-slate-500 block">{holiday.note}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Islamic Holidays */}
                <div>
                    <h4 className="text-md font-bold text-slate-300 mb-3 flex items-center gap-2">
                        <Moon size={16} className="text-green-400" />
                        المناسبات الإسلامية
                    </h4>
                    <div className="space-y-2">
                        {sortedHolidays.filter(h => h.type === 'islamic').map((holiday, idx) => (
                            <div key={idx} className={`flex justify-between items-center p-2 rounded hover:bg-slate-700/50 ${holiday.date >= today ? 'text-white' : 'text-slate-500'}`}>
                                <span>{holiday.name}</span>
                                <div className="text-right">
                                    <span className="text-sm font-mono block" dir="ltr">
                                        {new Date(holiday.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}
                                    </span>
                                    {holiday.note && <span className="text-xs text-slate-500 block">{holiday.note}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-4 text-center">
                        * التواريخ الإسلامية تعتمد على رؤية الهلال وقد تختلف بيوم أو يومين.
                    </p>
                </div>
            </div>
        </div>
    );
}
