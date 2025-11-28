import { useState } from 'react';
import { Plus, Trash2, MessageCircle } from 'lucide-react';
import { useWhatsAppStore } from '../../store/useWhatsAppStore';

export default function ContactsManager() {
    const { favoriteContacts, addContact, removeContact } = useWhatsAppStore();
    const [isAdding, setIsAdding] = useState(false);
    const [newContact, setNewContact] = useState({ name: '', phoneNumber: '' });

    const handleAdd = async () => {
        if (!newContact.name || !newContact.phoneNumber) return;

        await addContact(newContact);
        setNewContact({ name: '', phoneNumber: '' });
        setIsAdding(false);
    };

    const handleRemove = async (id: string) => {
        await removeContact(id);
    };

    return (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <MessageCircle className="text-emerald-400" size={24} />
                    <h3 className="text-lg font-bold text-white">جهات اتصال WhatsApp المفضلة</h3>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <Plus size={18} />
                    <span>إضافة</span>
                </button>
            </div>

            {/* Add Form */}
            {isAdding && (
                <div className="mb-6 p-4 bg-slate-900 rounded-lg border border-slate-700">
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="الاسم"
                            value={newContact.name}
                            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <input
                            type="tel"
                            placeholder="رقم الهاتف (مثال: 966501234567)"
                            value={newContact.phoneNumber}
                            onChange={(e) => setNewContact({ ...newContact, phoneNumber: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            dir="ltr"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleAdd}
                                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            >
                                حفظ
                            </button>
                            <button
                                onClick={() => {
                                    setIsAdding(false);
                                    setNewContact({ name: '', phoneNumber: '' });
                                }}
                                className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contacts List */}
            <div className="space-y-3">
                {favoriteContacts.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">لا توجد جهات اتصال محفوظة</p>
                ) : (
                    favoriteContacts.map((contact) => (
                        <div
                            key={contact.id}
                            className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700 hover:border-emerald-500/50 transition-colors"
                        >
                            <div>
                                <p className="font-semibold text-white">{contact.name}</p>
                                <p className="text-sm text-slate-400 font-mono" dir="ltr">{contact.phoneNumber}</p>
                            </div>
                            <button
                                onClick={() => handleRemove(contact.id)}
                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {favoriteContacts.length > 0 && (
                <p className="text-xs text-slate-500 mt-4">
                    💡 يمكنك استخدام هذه الجهات للمشاركة السريعة عبر WhatsApp
                </p>
            )}
        </div>
    );
}
